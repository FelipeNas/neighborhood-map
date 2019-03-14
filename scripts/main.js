// Declaring the variables of Google Maps Api
var map;
var markers = [];
var largeInfoWindow;

// Alert in case of not being able to connect to the Google Maps Api
function googleRequestError() {
  alert('Unable to connect to Google Maps Api');
  document.getElementById('map').innerHTML = '<h3 class=google-error>Unable to connect to Google Maps Api</h3>';
}

// Callback function of Google Maps Api
function initMap() {
  // Setting the Google maps api with position
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -27.594517, lng: -48.535801},
    zoom: 13
  });

  // Setting the markers
  setMarkers(map);
}

// Setting the markers function
function setMarkers(map) {
  // Creating bounds of map to extend
  var bounds = new google.maps.LatLngBounds();
  // Creating infowindo for markers
  largeInfoWindow = new google.maps.InfoWindow();

  // Creating Marker
  for (var i = 0; i < locations.length; i++) {
    var position = locations[i].location;
    var title = locations[i].title;

    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      text: 'Loading...'
    });

    bounds.extend(marker.position);
    markers.push(marker);
    marker.addListener('click', function(){
      populateInfoWindow(this, largeInfoWindow);
      toggleBounce(this);
    });
  }

  // Setting the bounds of map accordingly to markers positions
  map.fitBounds(bounds);
  // Calling wiki api
  wikiapi();
}

// Creating the infowindow
function populateInfoWindow(marker, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    var content = `<div><h3>${marker.title}</h3></div><ul class='marker-text-list'>${marker.text}</ul>`;
    infowindow.setContent(content);
    infowindow.open(map, marker);
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
      marker.setAnimation(google.maps.Animation.STOP);
    });
  } else {
    infowindow.close();
    infowindow.marker = null;
  }
}

// Make the marker bounce
function toggleBounce(marker) {
  if (marker.getAnimation() !== 1) {
    for (var i = 0; i < markers.length; i++){
      markers[i].setAnimation(google.maps.Animation.STOP);
    }
  }

  if (typeof marker.getAnimation() !== 'undefined') {
    marker.setAnimation(google.maps.Animation.STOP);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

// Wiki api ajax
function wikiapi() {
  var content;
  var url;

  for (var i = 0; i < markers.length; i++) {
    url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${markers[i].title}&format=json&callback=wikiCallback`;
    
    // Ajax
    (function(i) {
      $.ajax({
        url: url,
        dataType: 'jsonp',
        success: function(response) {
          var links = response[3];
          var titles = response[1];
          content = '';
          for (var l = 0; l < titles.length; ++l) {
            content += `<li><a href='${links[l]}' target='_blank' rel='noopener noreferrer'>${titles[l]}</a></li>`;
          }
          if (links == 0) {
            content += '<div>No wiki articles</div>';
          }
          // Setting the text of the markers
          markers[i].text = content;
          // Clearing the timeout;
        }
      })
        .fail(function() {
          content = '<li>Unable to connect to wikipedia</li>';
          markers[i].text = content;

          if (i === 0) alert('Unable to connect to wikipedia');
        });
    })(i);
  }
}

// Model for the list of locations
var model = function(data) {
  var self = this;
  self.title = data.title;
  self.position = data.location;

  // Hide the marker when filtered
  self.hideMarker = function() {
    for (var i = 0; i < markers.length; i++) {
      if (self.title === markers[i].title) {
        markers[i].setMap(null);
      }
    }
  };

  // Show the marker when filtered
  self.showMarker = function() {
    for (var i = 0; i < markers.length; i++) {
      if (self.title === markers[i].title) {
        markers[i].setMap(map);
      }
    }
  };

  // Open the infowindow when clicked on the location
  self.info = function() {
    for (var i = 0; i < markers.length; i++) {
      if (self.title === markers[i].title) {
        marker = markers[i];
        populateInfoWindow(marker, largeInfoWindow);
        toggleBounce(marker);
      }
    }
  };
};

// ViewModel
var ViewModel = function() {
  var self = this;

  self.filtering = ko.observable('');
  self.locationsArray = ko.observableArray([]);
  self.openClass = ko.observable(false);

  // Pushing locations to locations array
  locations.forEach(function(location) {
    self.locationsArray.push(new model(location));
  });

  // List and markers shown, updates as it is written on the filter
  self.filterList = ko.computed(function() {
    return self.locationsArray().filter(
      function(location) {
        // Verifing if locations contains filter input
        function check() {
          return location.title.toLowerCase().includes(self.filtering().toLowerCase());
        }

        // Hiding markers
        if (check()) {
          location.showMarker();
        } else {
          location.hideMarker();
        }

        return (self.filtering().length == 0 || check());
      }
    );
  });

  self.showFilter = function() {
    if (self.openClass()) {
      self.openClass(false);
    } else {
      self.openClass(true);
    }
  };
};

ko.applyBindings(new ViewModel());
