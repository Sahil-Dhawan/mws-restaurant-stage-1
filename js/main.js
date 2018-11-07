let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */

 if (navigator.serviceWorker)
 {
   navigator.serviceWorker.register('/sw.js').then(function(){
     // Registration was successful
     console.log(`Registration of service worker successful`);
   }, err => {
     // registration failed
     console.log(`Registration of service worker failed with error : ${err}`);
   });
 }

window.addEventListener('online',syncOfflineFavorites);

function syncOfflineFavorites(){
  let dbPromise = DBHelper.openDatabase();
  console.log("online");
  DBHelper.get_idb_offline_favorites(dbPromise).then(favorites =>{

    if(favorites && favorites.length > 0){
      favorites.forEach((favorite,i) => {
        console.log(favorite);
        console.log(i);
        fetch(`http://localhost:1337/restaurants/${favorite.restaurant_id}/?is_favorite=${favorite.is_favorite}`,{
          method: 'PUT',
          headers:{
            'Content-Type': 'application/json'
          }
        }).then(response => response.json()).then(function(response){

                console.log("Favorite Submission successful");
                    favorites.shift();
                      DBHelper.put_idb_offline_favorites_sync(favorites,dbPromise);



        }).catch(function(error){

        return;
      });
    });
    }
        else{
          console.log("no offline favorites left to be synced");
        }
      });

}

document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
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

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('div');
  li.className='restaurant-list-div';
  const li_list = document.createElement('li');
  li.setAttribute('tabindex',"0");
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const imgurl=DBHelper.imageUrlForRestaurantListing(restaurant);
  const imgurlsplit=imgurl.split(".");
  const imgurl1x=`${imgurlsplit[0]}_1x.${imgurlsplit[1]}`;
  const imgurl2x=`${imgurlsplit[0]}_2x.${imgurlsplit[1]}`;
  source.srcset=`${imgurl1x} 300w,${imgurl2x} 600w`;
  const image = document.createElement('img');
  picture.className = 'restaurant-img';
  image.className = 'restaurant-img';
  image.alt = `${restaurant.name} restaurant `;
  image.src = imgurl2x;
  picture.append(source);
  picture.append(image);
  li.append(picture);


  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute('aria-label',`located in neighborhood ${restaurant.neighborhood}`);
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label',`at address ${restaurant.address}`);
  li.append(address);

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label',`View ${restaurant.name} Details`);
  //more.aria-labelledby=`view ${restaurant.name} details`
  more.onclick=function(){
    window.location=DBHelper.urlForRestaurant(restaurant);

  };
  //more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  const fav_btn = document.createElement('button');
  fav_btn.id = `fav_btn-${restaurant.id}`;
  fav_btn.className = 'fav_btn';

  if(restaurant.is_favorite == 'false'){
    fav_btn.innerHTML = '&#9825;';
    fav_btn.className = 'fav_btn not_fav';
    fav_btn.setAttribute(`aria-label`,`Button to set restaurant ${restaurant.name} as favorite`);
  }
  else {
    fav_btn.innerHTML = '&#x1F493;';
    fav_btn.className = 'fav_btn fav';
    fav_btn.setAttribute(`aria-label`,`Button to remove restaurant ${restaurant.name} from favorites`);
  }

  fav_btn.addEventListener('click', function(){
    favRestaurant(restaurant)
  });

  li.append(fav_btn);
  li_list.append(li);
  return li_list;
}

/**
* Function to Favorite the restaurants *
**/

// favourite your restaurant
function favRestaurant(restaurant) {
  let fav_btn = document.getElementById(`fav_btn-${restaurant.id}`);
  let desc_toast = document.getElementById(`desc-toast`);
  let toast = document.getElementById(`toast`);
  if (fav_btn.className == 'fav_btn not_fav'){

    fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=true`,{
      method: 'PUT',
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => response.json()).then(function(){
      fav_btn.innerHTML = '&#x1F493;';
      fav_btn.className = 'fav_btn fav';
      desc_toast.innerHTML = `Added to favourites`;
      toast.className = `show`;
      setTimeout(function(){
        toast.className = toast.className.replace(`show`,``);
      },5000);
      DBHelper.updatefavIDB(restaurant,"true");
    }).catch(function(error){
    let dbPromise = DBHelper.openDatabase();
    let favorites = {
      restaurant_id : restaurant.id,
      is_favorite : 'true'
    }
    DBHelper.put_idb_offline_favorites(favorites,dbPromise);
    fav_btn.innerHTML = '&#x1F493;';
    fav_btn.className = 'fav_btn fav';
    desc_toast.innerHTML = `Added to favourites`;
    toast.className = `show`;
    setTimeout(function(){
      toast.className = toast.className.replace(`show`,``);
    },5000);
    DBHelper.updatefavIDB(restaurant,"true");
    console.log("You are currently offline and the favorites would be synced with the server once you are back online");
  });
  }
  else{
    fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=false`,{
      method: 'PUT',
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => response.json()).then(function (){
      //change the css style of star icon from filled to blank
      fav_btn.innerHTML = '&#9825;';
      fav_btn.className = 'fav_btn not_fav';
      desc_toast.innerHTML = `Removed from favourites`;
      toast.className = `show`;
      setTimeout(function(){
        toast.className = toast.className.replace(`show`,``);
      },5000);
      DBHelper.updatefavIDB(restaurant,"false");
    }).catch(function(error){
    let dbPromise = DBHelper.openDatabase();
    let favorites = {
      restaurant_id : restaurant.id,
      is_favorite : 'false'
    }
    DBHelper.put_idb_offline_favorites(favorites,dbPromise);
    fav_btn.innerHTML = '&#9825;';
    fav_btn.className = 'fav_btn not_fav';
    desc_toast.innerHTML = `Removed from favourites`;
    toast.className = `show`;
    setTimeout(function(){
      toast.className = toast.className.replace(`show`,``);
    },5000);
    DBHelper.updatefavIDB(restaurant,"false");
    console.log("You are currently offline and the favorites would be synced with the server once you are back online");
  });


  }



}


/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
