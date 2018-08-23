let staticCacheName = 'restaurantsw-static-v1';
let contentImageCacheName = 'restaurantsw-image-static-v1';
let contentPageCacheName = 'restaurantsw-page-static-v1';
let allCaches = [
  staticCacheName,
  contentImageCacheName,
  contentPageCacheName
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      console.log("in install");
      return cache.addAll([
        'index.html',
        'restaurant.html',
        'js/main.js',
        'js/restaurant_info.js',
				'js/dbhelper.js',
        'js/idb.js',
        'sw.js',
				'css/styles.css',
        'css/mediaqueries.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurantsw-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
    if (requestUrl.pathname.endsWith('.jpg')||requestUrl.pathname.endsWith('.png')) {
    //  console.log("in img endswith")
      event.respondWith(servePhoto(event.request));
      return;
    }
    if (event.request.url.includes('.html')){
      event.respondWith(servePage(event.request));
      return;
    }


  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
function servePage(request) {
  let storageUrl =request.url;

  return caches.open(contentPageCacheName).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function servePhoto(request) {
  let storageUrl =request.url;
  if(request.url.includes('_1x')){
  storageUrl = request.url.replace('1x','2x');
}
  //storageUrl = request.url.replace(/_\d+x\.jpg$/, '');

  return caches.open(contentImageCacheName).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}


self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
