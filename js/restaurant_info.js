let restaurant;
var newMap;

/** Service Worker Registration
      **/

if (navigator.serviceWorker)
  {
    navigator.serviceWorker.register('/sw.js').then(function(){
      // Registration was successful
      console.log(`Registration of service worker successful`);
  }, err =>
      {
      // registration failed
      console.log(`Registration of service worker failed with error : ${err}`);
      });
  }



/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});
let h = document.getElementById('restaurant-header').scrollHeight;
document.getElementsByClassName('restaurant-main-content')[0].style.paddingTop =h+"px";
 //console.log("size"+document.getElementsByClassName('restaurant-main-content')[0].style.paddingTop+"h is"+h);

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiZXhjZWxzaW9yc2QiLCJhIjoiY2ppcG55YXRiMDZ5ZzNxbW9zeXc1Z2oyNyJ9.DMpCV5kd55zrH0ZaSV4N3A',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label',` Restaurant name ${restaurant.name}`);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label',`, located at address ${restaurant.address}`);

  const picture = document.getElementById('restaurant-picture');
  const source = document.getElementById('restaurant-source');
  const imgurl=DBHelper.imageUrlForRestaurantBanner(restaurant);
  const imgurlsplit=imgurl.split(".");
  const imgurl1x=`${imgurlsplit[0]}_1x.${imgurlsplit[1]}`;
  const imgurl2x=`${imgurlsplit[0]}_2x.${imgurlsplit[1]}`;
  source.srcset=`${imgurl1x} 800w,${imgurl2x} 1600w`;
  const image = document.getElementById('restaurant-img');
  picture.className = 'restaurant-img';
  image.className = 'restaurant-img';
  image.alt = `, ${restaurant.name} restaurant picture`;
  image.src = imgurl2x;



  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.setAttribute('aria-label',`, Specializes in cuisine ${restaurant.cuisine_type}`);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);
    let strtimemore=[];
    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    const strtime=operatingHours[key].toString();
    if(strtime.indexOf(',')!=-1)
    strtimemore=strtime.split(',');
    else strtimemore[0]=strtime;
    let aria_lbl="";
    for(i=0;i<strtimemore.length;i++){
    const splitstr=strtimemore[i].split('-');
    aria_lbl+=`${splitstr[0]} to ${splitstr[1]}` ;
    if(i+1==strtimemore.length)
    continue;
    aria_lbl+=` and `;
    }

    //console.log(aria_lbl);
    time.setAttribute('aria-label',` timings are ${aria_lbl}.`);
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'REVIEWS';
  container.appendChild(title);
  DBHelper.fetchReviews(self.restaurant).then(reviews => {

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      noReviews.setAttribute('aria-label',` no reviews yet!`);

      return;
    }
    const ul = document.getElementById('reviews-list');
    console.log(reviews);
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);

  })

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('aria-label',` Review by ${review.name}.`);

  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  date.setAttribute('aria-label',`  on date ${new Date(review.createdAt).toDateString()}.`);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('aria-label',` the rating is ${review.rating}.`);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('aria-label',` and ${review.name}'s comments for the restaurant are , ${review.comments}.`)
  li.appendChild(comments);

  return li;
}

/**
* Add Review entered by user
*/

const review_form = document.querySelector('#review-form');

review_form.addEventListener('submit', event => {
  event.preventDefault();
  let rating=1;
  const ratingarray = document.querySelectorAll('.rating-input');
  ratingarray.forEach(ratings => {
	if(ratings.checked)
  {
    console.log(ratings.value);
    rating = ratings.value;
  }
  });
  const review = {
    id:-1,
    restaurant_id: self.restaurant.id,
    name: review_form.querySelector('#input-name').value,
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    rating: rating,
    comments: review_form.querySelector('#input-comments').value,
  }

  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  review_form.reset();
  console.log(review);

});



/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
