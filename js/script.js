var app = {
  locationData:{},
  dataConfig:{},
  formResults:{},
  navInitLeft:undefined,
  mapbox:{
    map:null,
    initMapbox:function(){
      // Mapbox methods for initial setup of mapbox
      mapboxgl.accessToken = 'pk.eyJ1IjoibWNjYXJ0aHlxIiwiYSI6ImNqaTNucHpsMzAwaGczcXF2eDJhbGxwNGwifQ.Qn-qvcjlEmkiLq4lqV435A';
      var map = new mapboxgl.Map({
        container:"map",
        style:"mapbox://styles/mccarthyq/cji9h1jw0124i2sqitzoczzsh",
        center:[174.777623,-41.289632],
        zoom:12
      });

      // Keep track of the map as a variable in the app for use later on
      app.mapbox.map = map;

      // Add geolocate control to the map
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions:{
          enableHighAccuracy:true
        },
        trackUserLocation:true
      }));

      // Update the map's size as well as the curr-step el every time the window is resized
      // This prevents the map and curr-step el from being sized weirdly
      $(window).resize(function(){
        $(".curr-step").css({
          "width":$(".main-navbar .col-sm div").css("width"),
          "height":$(".main-navbar .col-sm div").css("height")
        });

        map.resize();
      });
    },
    mapSubmit:function(e){
      app.formResults.desiredLocation = app.locationData.features[$(this).attr("data-submit")];

      var prop = app.formResults.desiredLocation.properties;

      $(".desired-location").text(prop.name);
      $(".desired-address").text(prop.address);
      $(".desired-phone-num").text(prop.phoneFormatted);

      $(".desired-space").text(app.formResults.desiredSpace);
      $(".desired-days").text(app.formResults.desiredDays);

      function writeToCost(i){
        $(".desired-cost").text("$"+app.dataConfig.types[i].properties.costNightly+" / Night");
      }

      switch(prop.type){
        case "hotel":
          writeToCost(0);

          break;
        case "hostel":
          writeToCost(1);

          break;
        case "motel":
          writeToCost(2);

          break;
        case "house":
          writeToCost(3);

          break;
      };

      // Switch the steps. Bootstrap display class used.
      $(".step-2").addClass("d-none");
      $(".step-3").removeClass("d-none");

      app.animateNav(3);
    },
    writeLocationData:function(prop, index){
      $(".location-info div.col-9 h4").remove();
      $(".location-info div.col-9").prepend($("<h4>").text(prop.name));
      $(".location-info div.col-9 span").html("<strong>Ph#:</strong> "+prop.phoneFormatted);

      function writeToDiv(i){
        $(".location-info div.col-9 div").html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[i].properties.costNightly);
      }

      switch(prop.type){
        case "hotel":
          writeToDiv(0);

          break;
        case "hostel":
          writeToDiv(1);

          break;
        case "motel":
          writeToDiv(2);

          break;
        case "house":
          writeToDiv(3);

          break;
      };

      $(".location-info div.d-flex").html("").append(
        $("<button>", {
          "class":"btn btn-primary mapSubmit",
          "data-submit":index,
          "type":"submit"
        }).text("Confirm")
          .on("click",app.mapbox.mapSubmit)
      );
    },
    createMarkers:function(hotels,hostels,motels,houses){
      // Object imitates geojson data structure
      var locations = {
        type:"FeatureCollection",
        features:[]
      };

      var features = app.locationData.features;

      for(var i = 0; i < features.length; i++){
        var currType = features[i].properties.type;

        // The expressions in these variables return a boolean value
        // This process has been broken down just to make it easier to read and work with
        var hotelType = (hotels && (currType == "hotel")),
            hostelType = (hostels && (currType == "hostel")),
            motelType = (motels && (currType == "motel")),
            houseType = (houses && (currType == "house"));

        if(hotelType || hostelType || motelType || houseType){
          locations.features.push(features[i])
        }
      }

      // Add the data to the map as a layer
      app.mapbox.map.addSource("places", {
        type:"geojson",
        data:locations
      });

      // Create a marker for every location
      locations.features.forEach(function(marker,index){
        // Create a div element for the marker
        // Non-jQuery creation as mapbox code is not very supportive
        var el = document.createElement("div");
        $(el)
          .attr("dataPosition",index)
          .addClass("marker");

        new mapboxgl.Marker(el, {offset:[0,-23]})
          .setLngLat(marker.geometry.coordinates)
          .addTo(app.mapbox.map);

        $(el).on("click", function(e){
          var activeItem = $(".active");

          // 1. Fly to the point
          app.mapbox.flyToStore(marker);

          // 2. Close all other popups and display popup for clicked store
          app.mapbox.createPopUp(marker);

          e.stopPropagation();

          var thisIndex;

          // Find the index for the current marker in the array
          for(var i = 0; i < app.locationData.features.length; i++){
            if(app.locationData.features[i] == marker){
              thisIndex = i;
              break;
            }
          }

          app.mapbox.writeLocationData(marker.properties, thisIndex);
        });
      });

      app.mapbox.buildLocationList(locations);
    },
    buildLocationList:function(data){
      // Iterate through the list of locations
      for(var i = 0; i < data.features.length; i++){
        var currentFeature = data.features[i],
            prop = currentFeature.properties,
            listings = $("#listings"),
            listing = $("<a>", {
              "class":"dropdown-item",
              "href":"#",
              "id":"listing"-i,
              "dataPosition":i
            }).html(prop.name)
              .on("click",function(){
                // Update the currentFeature to the location associated with the clicked link
                var clickedListing = data.features[$(this).attr("dataPosition")];

                // 1. Fly to the point associated with the clicked link
                app.mapbox.flyToStore(clickedListing);

                // 2. Close all other popups and display popup for clicked store
                app.mapbox.createPopUp(clickedListing);

                var thisIndex = $(this).attr("dataPosition");

                app.mapbox.writeLocationData(data.features[thisIndex].properties, thisIndex);
              })
              .appendTo(listings);
      }
    },
    flyToStore:function(currentFeature){
      app.mapbox.map.flyTo({
        center:currentFeature.geometry.coordinates,
        zoom:15
      });
    },
    createPopUp:function(currentFeature){
      var popUps = $(".mapboxgl-popup");

      // Check if there's already a popup on the map and if so, remove it
      if(popUps[0]){
        popUps[0].remove();
      }

      var popup = new mapboxgl.Popup({closeOnClick:true})
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML("<h5>"+currentFeature.properties.name+"</h5>"+"<h6>"+currentFeature.properties.address+"</h6>")
        .addTo(app.mapbox.map);
    }
  },
  init:function(){
    $.getJSON("assets/dataConfig.json", function(data){
      app.dataConfig = data;

      var types = app.dataConfig.types;

      // Values here are manually set but may not be correct
      var minPossibleSpace = types[0].properties.minSpace,
          maxPossibleSpace = types[1].properties.maxSpace,
          minPossibleStay = types[0].properties.maxStay,
          maxPossibleStay = types[3].properties.maxStay;

      // For loop ensures the variables above are correct
      for(var i = 0; i < types.length; i++){
        var currMinSpace = types[i].properties.minSpace,
            currMaxSpace = types[i].properties.maxSpace,
            currMinStay = types[i].properties.minStay,
            currMaxStay = types[i].properties.maxStay;

        if(currMinSpace < minPossibleSpace){
          minPossibleSpace = currMinSpace;
        }
        if(currMaxSpace > maxPossibleSpace){
          maxPossibleSpace = currMaxSpace;
        }

        if(currMinStay < minPossibleStay){
          minPossibleStay = currMinStay;
        }
        if(currMaxStay > maxPossibleStay){
          maxPossibleStay = currMaxStay;
        }
      }

      // Set the form's min and max values for validation
      $(".space-range-slider").attr({
        "min":minPossibleSpace,
        "max":maxPossibleSpace
      }).on("input",function(){
        // The slider and the input should always have the same value
        $(".space-range-input").val($(this).val());
      });

      $(".space-range-input").attr({
        "min":minPossibleSpace,
        "max":maxPossibleSpace
      }).on("input",function(){
        // The slider and the input should always have the same value
        $(".space-range-slider").val($(this).val());
      });

      var todayDate = new Date();

      $(".staying-range").daterangepicker({
        drops:"up",
        opens:"center",
        startDate:todayDate,
        minDate:todayDate,
        maxSpan:{
          days:maxPossibleStay
        },
        locale:{
          format:"DD/MM/YYYY"
        }
      }, function(start, end, label){
        app.formResults.stayingFrom = start.format("DD/MM/YYYY");
        app.formResults.stayingTill = end.format("DD/MMMM/YYYY");
      });

      $(".detail-submit").click(function(e){
        // Prevent page reload
        e.preventDefault();

        $(".flagForDel").remove();
        $(".space-range-input").parent().css("border","0");
        $(".staying-range").parent().css("border","0");

        var spaceNeeded = parseInt($(".space-range-input").val());

        if((spaceNeeded >= minPossibleSpace) && (spaceNeeded <= maxPossibleSpace)){
          app.formResults.desiredSpace = spaceNeeded;
        }
        else{
          $(".space-range-input").parent().append(
            $("<span>", {
              "class":"flagForDel",
              "style":"color:darkred"
            }).text("Must be between "+minPossibleSpace+" and "+maxPossibleSpace)
          ).css("border","2px solid red");
        }

        var stayingFrom = app.formResults.stayingFrom,
            stayingTill = app.formResults.stayingTill;

        // If the values are defined
        if(stayingFrom && stayingTill){
          // The values must be converted back into Date objects to get the days
          var fromDays = (new Date(stayingFrom)).getDate(),
              tillDays = (new Date(stayingTill)).getDate();

          var days = (tillDays - fromDays);

          if((days >= minPossibleStay) && (days <= maxPossibleStay)){
            app.formResults.desiredDays = days;
          }
          else{
            $(".staying-range").parent().css("border","2px solid red").append(
              $("<span>", {
                "class":"flagForDel",
                "style":"color:darkred"
              }).text("Days must be between "+minPossibleStay+" and "+maxPossibleStay)
            );
          }
        }
        else{
          $(".staying-range").parent().css("border","2px solid red");
        }

        var desiredSpace = app.formResults.desiredSpace,
            desiredDays = app.formResults.desiredDays;

        // Validation; the step shouldn't change if either of these values is undefined
        if(desiredSpace && desiredDays){
          // Variables to be used in a future function call
          var hotels, hostels, motels, houses = false;

          // The expressions in these variables return a boolean value
          // This process has been broken down just to make it easier to read and work with
          for(var i = 0; i < types.length; i++){
            var prop = types[i].properties

            var minSpace = (desiredSpace >= prop.minSpace),
                maxSpace = (desiredSpace <= prop.maxSpace),
                minStay = (desiredDays >= prop.minStay),
                maxStay = (desiredDays <= prop.maxStay);

            switch(i){
              case 0:
                var hotelSpace = (minSpace && maxSpace),
                    hotelStay = (minStay && maxStay);

                break;
              case 1:
                var hostelSpace = (minSpace && maxSpace),
                    hostelStay = (minStay && maxStay);

                break;
              case 2:
                var motelSpace = (minSpace && maxSpace),
                    motelStay = (minStay && maxStay);

                break;
              case 3:
                var houseSpace = (minSpace && maxSpace),
                    houseStay = (minStay && maxStay);
            };
          }

          if(hotelSpace && hotelStay){
            hotels = true;
          }
          if(hostelSpace && hostelStay){
            hostels = true;
          }
          if(motelSpace && motelStay){
            motels = true;
          }
          if(houseSpace && houseStay){
            houses = true;
          }

          app.mapbox.createMarkers(hotels,hostels,motels,houses);

          $(".desired-space-val").text(desiredSpace);

          var daysText = "days";

          if(desiredDays == 1){
            daysText = "day";
          }

          $(".desired-days-val").text(desiredDays+" "+daysText);

          // Switch the steps. Bootstrap display class used.
          $(".step-1").addClass("d-none");
          $(".step-2").removeClass("d-none");

          app.mapbox.map.resize();

          app.navInitLeft = parseInt($(".curr-step").css("left"));

          app.animateNav(2);
        }
      })
    });

    $.getJSON("assets/accomodation.geojson", function(data){
      var locations = data;

      locations.features = app.sortData(locations.features);

      app.locationData = locations;

      app.mapbox.initMapbox();

      // All steps are visible initially to allow proper loading of elements such as mapbox
      // If the steps were hidden initially, certain elements would not stlye themselves properly.
      $(".step-2").addClass("d-none");
      $(".step-3").addClass("d-none");
    });

    $(".curr-step").css({
      "width":$(".main-navbar .col-sm div").css("width"),
      "height":$(".main-navbar .col-sm div").css("height")
    });

    $(".final-confirm").click(function(){
      // location.reload() is the easiest way to reset the page;
      // as other methods would require resetting the mapbox map
      // and the process for doing so is complicated
      location.reload();
    });
  },
  sortData:function(data){
    var nameArray = [];

    // Push the names of all the locations into an array to sort alphabetically
    for(var i = 0; i < data.length; i++){
      nameArray.push(data[i].properties.name);
    }

    nameArray.sort();

    var sortedArray = [];

    // Compare the sorted names against the values in the data; then sort the data
    // based on the names by pushing them into another array in order
    nameArray.forEach(function(currentValue,index){
      for(var i = 0; i < data.length; i++){
        if(currentValue == data[i].properties.name){
          sortedArray.push(data[i]);

          // Continue from the start after finding the name and pushing the data
          continue;
        }
      }
    });

    return sortedArray;
  },
  animateNav:function(step){
    if(step < 0){
      step = 0;
    }

    // Animation for the navbar
    var currStep = $(".curr-step");

    var transition = setInterval(function(){
      var currStepLeft = parseInt($(currStep).css("left")),
          adjWidth = parseInt($(".main-navbar .col-sm div").css("width")),
          desiredLeft = app.navInitLeft + (adjWidth * (step-1));

      if(currStepLeft < desiredLeft){
        $(currStep).css("left",currStepLeft+2+"px");
      }
      else{
        $(currStep).css("left",desiredLeft);
        clearInterval(transition);
      }
    }, 1);
  }
}

$(document).ready(function(){
  app.init();
});
