// Declaring the variables of Google Maps Api
var map;
var markers = [];
var largeInfoWindow;

// function with alert in case of not being able to connect to the Google Maps Api
function googleRequestError() {
  alert("Unable to connect to Google Maps Api");
}

// Callback function of Google Maps Api
function initMap() {
  // Setting the Google maps api with position
  map = new google.maps.Map(document.getElementById("map"), {
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
      text: "Loading..."
    });
    markers.push(marker);
    bounds.extend(marker.position);
    marker.addListener("click", function(){
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
    var content = "<div><h3>" + marker.title + "</h3><div>" + marker.text;
    infowindow.setContent(content);
    infowindow.open(map, marker);
    infowindow.addListener("closeclick", function() {
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
  if (typeof marker.getAnimation() !== "undefined") {
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
    //  Setting timeout in case of not being able to succeed the ajax
    var wikiRequestTimeout = setTimeout(function(i){
      content = "<div>Unable to connect to wikipedia</div>";
      markers[i].text = content;
      if (markers[0] === markers[i]) {
        alert("Unable to connect to wikipedia");
      }
    }, 8000 , i);
    // Defining the url for the ajax
    url = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + markers[i].title + "&format=json&callback=wikiCallback";
    // Ajax
    (function(i, wikiRequestTimeout) { $.ajax({
      url: url,
      dataType: "jsonp",
      success: function(response) {
        var links = response[3];
        var titles = response[1];
        content = "";
        for (var l = 0; l < titles.length; ++l) {
          content += "<div><a href='" + links[l] + "' target='_blank' rel='noopener noreferrer'>" + titles[l] + "</a></div>";
        }
        if (links == 0) {
          content += "<div>No wiki articles</div>";
        }
        // Setting the text of the markers
        markers[i].text = content;
        // clearing the timeout
        clearTimeout(wikiRequestTimeout);
      }});
    })(i, wikiRequestTimeout);
  }
}

// model for the list of locations
var model = function(data) {
  var self = this;
  self.title = ko.observable(data.title);
  self.position = ko.observable(data.location);

  // function to hide the marker when filtered
  self.hideMarker = function() {
    for (var i = 0; i < markers.length; i++) {
      if (self.title() === markers[i].title) {
        markers[i].setMap(null);
      }
    }
  };

  // function to show the marker when filtered
  self.showMarker = function() {
    for (var i = 0; i < markers.length; i++) {
      if (self.title() === markers[i].title) {
        markers[i].setMap(map);
      }
    }
  };

  // function to open the infowindow when clicked on the location
  self.info = function() {
    for (var i = 0; i < markers.length; i++) {
      if (self.title() === markers[i].title) {
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

  // Observable to get input information
  self.filtering = ko.observable("");

  // Observable Array for list of locations
  self.locationsArray = ko.observableArray([]);

  // Pushing locations to locations array
  locations.forEach(function(location) {
    self.locationsArray.push(new model(location));
  });

  // Code by Viraj Bhosale; https://codepen.io/vbhosale/pen/NMYRxe?editors=1010#0.
  // List shown, updates as it is written on the filter
  self.filterList = ko.computed(function() {
    return self.locationsArray().filter(
      function(location) {
        return (self.filtering().length == 0 || location.title().toLowerCase().includes(self.filtering().toLowerCase()));
      }
    );
  });

  // Filter the markers when clicked on filter button
  self.filter = function() {
    for (var i = 0; i < locations.length; i++) {
      self.locationsArray()[i].hideMarker();
      if (locations[i].title.toLowerCase().includes($("#filter-input").val().toLowerCase())) {
        self.locationsArray()[i].showMarker();
      }
    }
  };
};

ko.applyBindings(new ViewModel());
