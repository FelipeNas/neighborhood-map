// locations data
var locations = [
  {title: 'Florianopolis', location: {lat: -27.594517, lng: -48.535801}},
  {title: 'Federal University of Santa Catarina', location: {lat: -27.600420, lng: -48.519201}},
  {title: 'Hercilio Luz bridge', location: {lat: -27.593741, lng: -48.565648}},
  {title: 'Federal Institute of Santa Catarina', location: {lat: -27.594017, lng: -48.542968}},
  {title: 'Public Market of Florianopolis', location: {lat: -27.596936, lng: -48.552785}},
  {title: 'Morro da Cruz belvedere', location: {lat: -27.588502, lng: -48.533559}}
]

// defining the variables of googlemapsapi
var map;
var markers = [];
var largeInfoWindow;

// function called when get google.api response
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -27.594517, lng: -48.535801},
    zoom: 13
  });
  setMarkers(map)
}

function setMarkers(map) {
  var bounds = new google.maps.LatLngBounds();
  largeInfoWindow = new google.maps.InfoWindow();
  for (var i = 0; i < locations.length; i++) {
    var position = locations[i].location;
    var title = locations[i].title;
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      text: ""
    })
    markers.push(marker)
    bounds.extend(marker.position);
    marker.addListener('click', function(){
      populateInfoWindow(this, largeInfoWindow)
      toggleBounce(this)
    });
  }
  map.fitBounds(bounds);
  ajax();
}

function ajax() {
  var content;
  for (var i = 0; i < markers.length; i++) {
    var wikiRequestTimeout = setTimeout((function(i){
      content = "<div>Unable to connect to wikipedia</div>"
      markers[i].text = content
    })(i), 1);
    url = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + markers[i].title + "&format=json&callback=wikiCallback";
    (function (i) { $.ajax({
      url: url,
      dataType: "jsonp",
      success: function(response) {
        links = response[3];
        titles = response[1];
        content = "";
        for (var l = 0; l < titles.length; ++l) {
          content += "<div><a href='" + links[l] + "'>" + titles[l] + "</a></div>";
        }
        markers[i].text = content
        clearTimeout(wikiRequestTimeout)
      }})
    })(i);
  }
}

function populateInfoWindow(marker, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    var content = "<div><h3>" + marker.title + "</h3><div>" + marker.text
    infowindow.setContent(content)
    infowindow.open(map, marker);
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
      marker.setAnimation(google.maps.Animation.STOP)
    });
  } else {
    infowindow.close()
    infowindow.marker = null;
  }
}

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

function hideMarker(marker) {
  marker.setMap(null);
}

function showMarker(marker) {
  marker.setMap(map);
}

var ViewModel = function() {
  var self = this;

  self.locationsArray = ko.observableArray(locations);

  self.filter = function() {
    self.locationsArray([]);
    for (var i = 0; i < locations.length; i++) {
      if (locations[i].title.includes($("#filter-input").val())){
        self.locationsArray.push(locations[i])
      }
    }
    for (var i = 0; i < markers.length; i++) {
      hideMarker(markers[i])
      for (var l = 0; l < self.locationsArray().length; l++) {
        if (markers[i].title === self.locationsArray()[l].title) {
          showMarker(markers[i])
        }
      }
    }
  };

  self.showinfo = function(location) {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].title === location.title) {
        marker = markers[i]
        populateInfoWindow(marker, largeInfoWindow)
        toggleBounce(marker)
      }
    }
  };
}

ko.applyBindings(new ViewModel());
