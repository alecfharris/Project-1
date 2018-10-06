var myLatLng = {};
var currentLocation = {};
var realLoc = "";
var distanceNum = 3;
var service;

// Initialize Firebase
var config = {
  apiKey: configAPI.firebaseKey,
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
      console.log(pos);
      database.ref().push(pos);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function placeMarkers(latlngObj) {
  console.log('lat/long from placeMarkers: ', latlngObj);
  if(latlngObj && Object.keys(latlngObj).length > 0) {
    var marker = new google.maps.Marker({
      position: latlngObj,
      map: map,
      title: 'Hello World!'
    });
    marker.setMap(map);
  }
}

//compare the distance between the user and nearby games and put markers on games that are nearby
function compareDistance(latlngObj) {
  service.getDistanceMatrix(
    {
      origins: [realLoc],
      destinations: [latlngObj],
      travelMode: 'DRIVING',
      // transitOptions: TransitOptions,
      // drivingOptions: DrivingOptions,
      unitSystem: google.maps.UnitSystem.IMPERIAL
      // avoidHighways: Boolean,
      // avoidTolls: Boolean,
    }, function (response, status) {
      compareCallback(response, status, latlngObj);
    });

  
}

function compareCallback(response, status, latlngObj) {
  // See Parsing the Results for
  // the basics of a callback function.
  if (status == 'OK') {
    var origins = response.originAddresses;
    console.log('origins:', origins);
    var destinations = response.destinationAddresses;
    console.log(destinations);

    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements;
      console.log(results);
      if(results.length > 0) {
        for (var j = 0; j < results.length; j++) {
          var element = results[j];
          console.log(element);
          
          var distance = element.distance.text;
          var duration = element.duration.text;
          var from = origins[i];
          var to = destinations[j];
        }
        arrDistance = distance.split(" ");
        distanceNum = parseFloat(arrDistance[0]);
        //place markers if distance is close enough
        if (distanceNum <= 30.0) {
          placeMarkers(latlngObj);
          console.log("Test");
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
        console.log(results[0].formatted_address);
        realLoc = results[0].formatted_address;
        //Create Firebase event for adding location to the database and add a marker
      database.ref().on("child_added", function (childSnapshot, prevChildKey) {
        lati = childSnapshot.val().lati;
        longi = childSnapshot.val().longi;
        var lat = parseFloat(lati);
        var lng = parseFloat(longi);
        myLatLng = { lat, lng };
        console.log(myLatLng);
        compareDistance({ lat, lng });
        console.log(distanceNum);
      })
        // compareDistance();
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}