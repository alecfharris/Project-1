var myLatLng = {};
var currentLocation = {};
var realLoc = "";
var distanceNum = 3;
var service;

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCone0OfA1j0tZF9y4rnu9mDAvfqajHALY",
  authDomain: "u-game-database.firebaseapp.com",
  databaseURL: "https://u-game-database.firebaseio.com",
  projectId: "u-game-database",
  storageBucket: "u-game-database.appspot.com",
  messagingSenderId: "273008181180"
};
firebase.initializeApp(config);

var database = firebase.database();

// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.
var map, infoWindow;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 32.7766642, lng: -96.79698789999998 },
    zoom: 17
  });
  infoWindow = new google.maps.InfoWindow;
  service = new google.maps.DistanceMatrixService();

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      infoWindow.setPosition(pos);
      infoWindow.setContent('Location found.');
      infoWindow.open(map);
      map.setCenter(pos);
      currentLocation = pos;
      getAddress();

    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}

//Geocoding:
function codeAddress() {
  var geocoder = new google.maps.Geocoder();
  var address = document.getElementById('address').value;
  var title = document.getElementById('game-title').value;
  var description = document.getElementById('game-description').value;
  var name = document.getElementById('name').value;
  var contact = document.getElementById('contact').value;

  document.getElementById('address').value = 'Address';
  document.getElementById('game-title').value = 'Game Title';
  document.getElementById('game-description').value = 'Game Description';
  document.getElementById('name').value = 'Name of Game Owner';
  document.getElementById('contact').value = 'Contact Info'
  geocoder.geocode({ 'address': address }, function (results, status) {
    if (status == 'OK') {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: map,
        position: results[0].geometry.location
      });
      var pos = {
        lati: marker.position.lat(),
        longi: marker.position.lng()
      }
      var game = {
        pos: pos,
        address: address,
        title: title,
        description: description,
        name: name,
        contact: contact
      }
      database.ref().push(game);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function placeMarkers(latlngObj, childSnapshot, weather) {
  if (latlngObj && Object.keys(latlngObj).length > 0) {
    var marker = new google.maps.Marker({
      position: latlngObj,
      map: map,
      title: childSnapshot.val().title
    });
    var contentString = '<div class="content">' + '<div class="siteNotice">' + '</div>' + '<h1 class="game-title">' +
      childSnapshot.val().title + '</h1>' + '<div class="bodyContent">' + '<p>' + '<strong>Description: </strong>' + childSnapshot.val().description + '</p>' + '<p>' + '<strong>Game Owner: </strong>' + childSnapshot.val().name + '</p>'
      + '<p>' + '<strong>Contact Info: </strong>' + childSnapshot.val().contact + '<p>' + '<strong>Game Location: </strong>' + childSnapshot.val().address + '</p>';
    //if statement to post the rain if it has rained in the last hour.
    if (weather.rain) {
      contentString += "<p>" + "<strong>Amount of rain in the past hour: </strong>" + weather.rain["1h"] + " in" + "</p>";
    }
    else {
      contentString += "<p>" + "There is no rain in your area." + "</p>";
    }

    contentString += "<p>" + "<strong>Wind Speed: </strong>" + weather.wind.speed + " mph" + "</p>";
    contentString += "<p>" + "<strong>Temperature: </strong>" + weather.main.temp + " F" + "</p>"  + '</div>' + '</div>';
      var infoWindow = new google.maps.InfoWindow({
      content: contentString
    });
    marker.setMap(map);
    marker.addListener('click', function () {
      infoWindow.open(map, marker);
    })
  }
}

//compare the distance between the user and nearby games and put markers on games that are nearby
function compareDistance(latlngObj, childSnapshot, weather) {
  service.getDistanceMatrix(
    {
      origins: [realLoc],
      destinations: [latlngObj],
      travelMode: 'DRIVING',
      unitSystem: google.maps.UnitSystem.IMPERIAL
    }, function (response, status) {
      compareCallback(response, status, latlngObj, childSnapshot, weather);
    });


}

function compareCallback(response, status, latlngObj, childSnapshot, weather) {
  // See Parsing the Results for
  // the basics of a callback function.
  if (status == 'OK') {
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;

    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements;
      if (results.length > 0) {
        for (var j = 0; j < results.length; j++) {
          var element = results[j];

          var distance = element.distance.text;
          var duration = element.duration.text;
          var from = origins[i];
          var to = destinations[j];
        }
        arrDistance = distance.split(" ");
        distanceNum = parseFloat(arrDistance[0]);
        //place markers if distance is close enough
        if (distanceNum <= 30.0) {
          placeMarkers(latlngObj, childSnapshot, weather);
        }
      }

    }
  }
}

//get lat, long as a string address
function getAddress() {
  var geocoder = new google.maps.Geocoder;
  var latlng = { lat: currentLocation.lat, lng: currentLocation.lng };
  geocoder.geocode({ 'location': latlng }, function (results, status) {
    if (status === 'OK') {
      if (results[0]) {
        realLoc = results[0].formatted_address;
        //Create Firebase event for adding location to the database and add a marker
        database.ref().on("child_added", function (childSnapshot, prevChildKey) {
          lati = childSnapshot.val().pos.lati;
          longi = childSnapshot.val().pos.longi;
          var lat = parseFloat(lati);
          var lng = parseFloat(longi);
          myLatLng = { lat, lng };
          //function to search the api
          function showWeather(lat, lng) {

            var queryURL = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lng + "&units=imperial&APPID=7379902a075c3fc260a1353fb52dc81f";

            $.ajax({
              url: queryURL,
              method: "GET"
            })
              .then(function (callback) {
                var weather = callback;
                compareDistance({ lat, lng }, childSnapshot, weather);
              });
             
          }
            //grabbing the lat and lng vars and passing them into the function to search the api.
            weather = showWeather(lat, lng);
        })
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}
