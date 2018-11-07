


/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {

     const port = 1337;
     const localhost = 'localhost:';
  /*  let localhost=window.location.href.toString();
    localhost=localhost.substring(localhost.indexOf(":")+1);
  //  console.log(localhost+"before substr");
  let port="";
  if(localhost.indexOf(":")==-1)
  port = localhost.substr(localhost.indexOf(":"),localhost.indexOf("/")) ;
  else
  port = localhost.substr(localhost.indexOf(":"),5);
    localhost=localhost.substr(0,localhost.indexOf(":")); */

  // console.log(port+"is port"); // Change this to your server port
  // console.log(localhost+"after substr");
  //console.log(`Here is the url : : : : http:${localhost}${port}/restaurants`);
    return `http://${localhost}${port}/restaurants`;
  }
/*Initialize database*/
static openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  return idb.open('restaurants-idb', 1, function(upgradeDb) {
    let store = upgradeDb.createObjectStore('restaurants');
    let reviews = upgradeDb.createObjectStore('reviews');
    let offlineData = upgradeDb.createObjectStore('offlineData');
    let favOffline = upgradeDb.createObjectStore('favOffline');

  });
}

  /**
   * Fetch all restaurants.
   */

  static fetchRestaurants(callback) {
    const dbPromise = DBHelper.openDatabase();
    DBHelper.get_idb_restaurants(dbPromise).then(function(restaurants){
      if(restaurants && restaurants.length>0){
        callback(null,restaurants);
      }
      else{
        DBHelper.networkFetch(callback,dbPromise);
      }
    });

  }
  /**
   * Fetch all reviews of a particular restaurant.
   */

  static fetchReviews(restaurant) {

      const reviewsURL = `http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`;
      const dbPromise = DBHelper.openDatabase();

      return DBHelper.get_idb_reviews(dbPromise,restaurant).then(function(reviews){
            if(reviews && reviews.length>0)
              return reviews;
            else {
              return DBHelper.networkFetchReviews(dbPromise,restaurant,reviewsURL);
            }
          });
  }
  static fetchOfflineReviews(restaurant){
    const dbPromise = DBHelper.openDatabase();
    return DBHelper.get_idb_offline_reviews(dbPromise,restaurant).then(function(reviews){
          if(reviews && reviews.length>0)
            return reviews;
          else {
            console.log("No Offline reviews");
          }
        });
  }


  static networkFetch(callback,dbPromise){
    fetch(DBHelper.DATABASE_URL).then(response => {
      if(!response) return;
      return response.json();
    }).then(restaurants => {
      if(!restaurants)return;
      DBHelper.put_idb_restaurants(restaurants,dbPromise);
      callback(null,restaurants);
    }).catch(error => {
      callback(`Error : ${error}`,null);
    });
  }


    static networkFetchReviews(dbPromise,restaurant,reviewsURL){
      return fetch(reviewsURL).then(response => {
        if(!response) return;
        return response.json();
      }).then(reviews => {
        if(!reviews)return;
        DBHelper.put_idb_reviews(reviews,restaurant,dbPromise);
        return reviews;
      }).catch(error => {
        console.log(`Error : ${error}`,null);
      });
    }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
   static imageUrlForRestaurantBanner(restaurant) {
     if(restaurant.photograph==undefined)
     return (`/img/banner/${restaurant.id}.jpg`);
     return (`/img/banner/${restaurant.photograph}.jpg`);
   }
   static imageUrlForRestaurantListing(restaurant) {
     if(restaurant.photograph==undefined)
     return (`/img/listing/${restaurant.id}.jpg`);
     return (`/img/listing/${restaurant.photograph}.jpg`);
   }

  /**
  * get restaurants from idb DATABASE
  **/
  static get_idb_restaurants(dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('restaurants');
      let store=tx.objectStore('restaurants');
      return store.get('restaurants-list');

    })
  }
  /**
  * get reviews from idb DATABASE
  **/
  static get_idb_reviews(dbPromise,restaurant){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('reviews');
      let store=tx.objectStore('reviews');
      return store.get(restaurant.id);

    })
  }
  /**
  * get offline reviews from idb DATABASE
  **/
  static get_idb_offline_reviews(dbPromise,restaurant){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('offlineData');
      let store=tx.objectStore('offlineData');
      return store.get(restaurant.id);

    })
  }
  /**
  * get offline favorites from idb DATABASE
  **/
  static get_idb_offline_favorites(dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('favOffline');
      let store=tx.objectStore('favOffline');
      return store.get('favorites-list');

    })
  }
  /**
  * update restaurants in idb DATABASE
  **/
  static put_idb_restaurants(restaurants,dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('restaurants','readwrite');
      let store=tx.objectStore('restaurants');
      return store.put(restaurants,'restaurants-list');
      tx.complete;

    })
  }

  /**
  * update reviews in idb DATABASE
  **/
  static put_idb_reviews(reviews,restaurant,dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('reviews','readwrite');
      let store=tx.objectStore('reviews');
      return store.put(reviews,restaurant.id);
      tx.complete;
    })
  }

  /**
  * update offline reviews after sync in idb DATABASE
  **/
  static put_idb_offline_reviews_sync(reviews,restaurant,dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('offlineData','readwrite');
      let store=tx.objectStore('offlineData');
      return store.put(reviews,restaurant.id);
      tx.complete;
    })

  }

    /**
    * update offline favorites after sync in idb DATABASE
    **/
  static put_idb_offline_favorites_sync(favorites,dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      let tx=db.transaction('favOffline','readwrite');
      let store=tx.objectStore('favOffline');
      return store.put(favorites,'favorites-list');
      tx.complete;
    })

  }

  /**
  * update offline favorites in idb DATABASE
  **/

  static put_idb_offline_favorites(favorites,dbPromise){
    return dbPromise.then(db=>{
      if(!db)return;
      DBHelper.get_idb_offline_favorites(dbPromise).then(favoritesindb => {
        if(favoritesindb){
          console.log(favoritesindb);
          favoritesindb.push(favorites);
          favorites = favoritesindb;
        }
        else{
          favoritesindb=[];
          favoritesindb.push(favorites);
          favorites = favoritesindb;
        }
        let tx=db.transaction('favOffline','readwrite');
        let store=tx.objectStore('favOffline');
        return store.put(favorites,'favorites-list');
        tx.complete;
    })
  })

  }


  /**
  * update offline reviews in idb DATABASE
  **/
  static put_idb_offline_reviews(reviews,restaurant,dbPromise){
    return dbPromise.then(db => {
      if(!db)return;
      DBHelper.get_idb_offline_reviews(dbPromise,restaurant).then(reviewsindb =>{
        if(reviewsindb){
          console.log(reviewsindb);
          reviewsindb.push(reviews);
          reviews = reviewsindb;
        }
        else{
          reviewsindb=[];
          reviewsindb.push(reviews);
          reviews = reviewsindb;
        }
        let tx=db.transaction('offlineData','readwrite');
        let store=tx.objectStore('offlineData');
        return store.put(reviews,restaurant.id);
        tx.complete;
      })


    })
  }


  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  static updatefavIDB(restaurant,fav){
    const dbPromise = DBHelper.openDatabase();
    DBHelper.get_idb_restaurants(dbPromise).then(function(restaurants){
      if(restaurants && restaurants.length>0){
        const updated_restaurants = restaurants.map(r => {
          if(restaurant.id == r.id)
          r.is_favorite=fav;
          return r;
        });
        if (updated_restaurants) { // Got the restaurant
          DBHelper.put_idb_restaurants(updated_restaurants,dbPromise);
          console.log("Updated the restaurant favorite")
        } else { // Restaurant does not exist in the database
          console.log('Restaurant does not exist in database');
        }

      }

      else{
        console.log('in else of updatefavIDB');
        DBHelper.networkFetch(callback,dbPromise);
      }
    });

  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
