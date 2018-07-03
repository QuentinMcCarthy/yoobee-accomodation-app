var app = {
  locationData:{},
  dataConfig:{},
  formResults:{},
  navInitLeft:undefined,
  navCurrStep:0,
  navTransition:null,
  mapbox:{
    map:null,
    markers:[],
    config:{
      initCenter:[174.777623,-41.289632],
      initZoom:12
    },
    initMapbox:function(){
      // Mapbox methods for initial setup of mapbox
      mapboxgl.accessToken = "pk.eyJ1IjoibWNjYXJ0aHlxIiwiYSI6ImNqaTNucHpsMzAwaGczcXF2eDJhbGxwNGwifQ.Qn-qvcjlEmkiLq4lqV435A";
      var map = new mapboxgl.Map({
        container:"map",
        style:"mapbox://styles/mccarthyq/cji9h1jw0124i2sqitzoczzsh",
        center:app.mapbox.config.initCenter,
        zoom:app.mapbox.config.initZoom
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

      // When the window is resized
      $(window).resize(function(){
        // Resize the step marker to ensure it's the correct size.
        $(".curr-step").css({
          "width":$(".main-navbar .col-sm div").css("width"),
          "height":$(".main-navbar .col-sm div").css("height")
        });

        // Ensure the step marker is in the correct position
        app.animateNav(app.navCurrStep);

        // Resize the map to ensure it's the correct size.
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
      }

      app.navigateToStep(2, 3);
    },
    writeLocationData:function(prop, index){
      $(".location-info div.col-9 .h4").text(prop.name);
      $(".location-info div.col-9 .phone-num").html("<strong>Ph#:</strong> "+prop.phoneFormatted);

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
      }

      $(".location-info div.d-flex").html("").append(
        $("<button>", {
          "class":"btn btn-primary map-submit",
          "data-submit":index,
          "type":"submit"
        }).text("Confirm")
          .on("click",app.mapbox.mapSubmit)
      );
    },
    createMarkers:function(hotels, hostels, motels, houses){
      // Object imitates geojson data structure
      var locations = {
        type:"FeatureCollection",
        features:[]
      };

      var dataFeatures = app.locationData.features;

      for(var i = 0; i < dataFeatures.length; i++){
        var currType = dataFeatures[i].properties.type;

        // The expressions in these variables return a boolean value
        // This process has been broken down just to make it easier to read and work with
        var hotelType = (hotels && (currType == "hotel")),
            hostelType = (hostels && (currType == "hostel")),
            motelType = (motels && (currType == "motel")),
            houseType = (houses && (currType == "house"));

        if(hotelType || hostelType || motelType || houseType){
          locations.features.push(dataFeatures[i]);
        }
      }

      // First we need to delete any existing markers and their source
      app.mapbox.markers.forEach(function(currentValue, index){
        app.mapbox.markers[index].remove();
      });

      // Empty the array after deleting all the markers
      app.mapbox.markers = [];

      // Try to delete the source, if it doesn't exist, don't print an error.
      try {
        app.mapbox.map.removeSource("places");
      }
      catch(err){
        // console.log("The source does not exist; continuing as normal");
      }

      // Add the data to the map as a layer
      app.mapbox.map.addSource("places", {
        type:"geojson",
        data:locations
      });

      // Create a marker for every location
      locations.features.forEach(function(marker, index){
        // Create a div element for the marker
        // Non-jQuery creation as mapbox code is not very supportive
        var el = document.createElement("div");
        $(el)
          .attr("dataPosition",index)
          .addClass("marker");

        var newMarker = new mapboxgl.Marker(el, {offset:[0,-23]})
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

        app.mapbox.markers.push(newMarker);
      });

      app.mapbox.buildLocationList(locations);
    },
    buildLocationList:function(data){
      // Clear any pre-existing listings
      $("#listings").html("");

      // Iterate through the list of locations
      data.features.forEach(function(currentValue, index){
        var thisIndex;

        // Find the index for the current item in the array
        for(var i = 0; i < app.locationData.features.length; i++){
          if(app.locationData.features[i] == currentValue){
            thisIndex = i;

            break;
          }
        }

        var currentFeature = data.features[index],
            prop = currentFeature.properties,
            listings = $("#listings"),
            listing = $("<a>", {
              "class":"dropdown-item",
              "href":"#",
              "id":"listing-"+thisIndex,
              "dataPosition":thisIndex
            }).html(prop.name)
              .on("click",function(){
                var thisIndex = $(this).attr("dataPosition");

                // Update the currentFeature to the location associated with the clicked link
                var clickedListing = app.locationData.features[thisIndex];

                // 1. Fly to the point associated with the clicked link
                app.mapbox.flyToStore(clickedListing);

                // 2. Close all other popups and display popup for clicked store
                app.mapbox.createPopUp(clickedListing);

                app.mapbox.writeLocationData(app.locationData.features[thisIndex].properties, thisIndex);
              })
              .appendTo(listings);
      });
    },
    flyToStore:function(currentFeature){
      app.mapbox.map.flyTo({
        center:currentFeature.geometry.coordinates,
        zoom:15
      });
    },
    createPopUp:function(currentFeature){
      // If there's any popups on the map, remove them.
      // There should not be more than one popup on the map at any time.
      $(".mapboxgl-popup").remove();

      new mapboxgl.Popup({closeOnClick:true})
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
      var minMaxSpaceStay = {
        minPossibleSpace:types[0].properties.minSpace,
        maxPossibleSpace:types[1].properties.maxSpace,
        minPossibleStay:types[0].properties.maxStay,
        maxPossibleStay:types[3].properties.maxStay,
      };

      // For loop ensures the variables above are correct
      for(var i = 0; i < types.length; i++){
        var currMinSpace = types[i].properties.minSpace,
            currMaxSpace = types[i].properties.maxSpace,
            currMinStay = types[i].properties.minStay,
            currMaxStay = types[i].properties.maxStay;

        if(currMinSpace < minMaxSpaceStay.minPossibleSpace){
          minMaxSpaceStay.minPossibleSpace = currMinSpace;
        }
        if(currMaxSpace > minMaxSpaceStay.maxPossibleSpace){
          minMaxSpaceStay.maxPossibleSpace = currMaxSpace;
        }

        if(currMinStay < minMaxSpaceStay.minPossibleStay){
          minMaxSpaceStay.minPossibleStay = currMinStay;
        }
        if(currMaxStay > minMaxSpaceStay.maxPossibleStay){
          minMaxSpaceStay.maxPossibleStay = currMaxStay;
        }
      }

      // Set the form's min and max values for validation
      // The slider's values are multiplied by 100 to ensure smooth movement
      $(".space-range-slider").attr({
        "min":(minMaxSpaceStay.minPossibleSpace * 100),
        "max":(minMaxSpaceStay.maxPossibleSpace * 100)
      }).on("input",function(){
        // The slider and the input should always have the same value
        $(".space-range-input").val(Math.round($(this).val() / 100));
      });

      $(".space-range-input").attr({
        "min":minMaxSpaceStay.minPossibleSpace,
        "max":minMaxSpaceStay.maxPossibleSpace
      }).on("input",function(){
        // The slider and the input should always have the same value
        $(".space-range-slider").val(($(this).val() * 100));
      });

      var todayDate = new Date();

      $(".staying-range").daterangepicker({
        drops:"up",
        opens:"center",
        startDate:todayDate,
        minDate:todayDate,
        maxSpan:{
          days:minMaxSpaceStay.maxPossibleStay
        },
        locale:{
          format:"DD/MM/YYYY"
        }
      }, function(start, end, label){
        app.formResults.stayingFrom = start.format("YYYY-MM-DD");
        app.formResults.stayingTill = end.format("YYYY-MM-DD");
      });

      $(".detail-submit").on("click",function(e){
        // Prevent page reload
        e.preventDefault();

        app.validateForm(minMaxSpaceStay);
      });
    });

    $.getJSON("assets/accomodation.geojson", function(data){
      var locations = data;

      locations.features = app.sortData(locations.features);

      app.locationData = locations;

      app.mapbox.initMapbox();
    });

    $(".arrow-r1").on("click",function(){ app.navigateToStep(1, 2); });
    $(".arrow-l2").on("click",function(){ app.navigateToStep(2, 1); });
    $(".arrow-r2").on("click",function(){ app.navigateToStep(2, 3); });
    $(".arrow-l3").on("click",function(){ app.navigateToStep(3, 2); });

    app.navCurrStep = 1;

    // All steps are visible initially to allow proper loading of elements such as mapbox
    // If the steps were hidden initially, certain elements would not style themselves properly.
    $(".step-1, .step-2, .step-3").addClass("d-none");

    $(".curr-step").css({
      "width":$(".main-navbar .col-sm div").css("width"),
      "height":$(".main-navbar .col-sm div").css("height")
    });

    // Navigation is initially hidden
    $(".main-navbar").addClass("d-none");

    $(".get-started").on("click",function(){
      $(".step-0").addClass("d-none");
      $(".step-1, .main-navbar").removeClass("d-none");
    });

    $(".nav-step-1").on("click",function(){ app.navigateToStep(app.navCurrStep, 1); });
    $(".nav-step-2").on("click",function(){ app.navigateToStep(app.navCurrStep, 2); });
    $(".nav-step-3").on("click",function(){ app.navigateToStep(app.navCurrStep, 3); });
    $(".final-confirm").on("click",function(){
      app.formResults = {};

      $(".space-range-input").val(1);
      $(".space-range-slider").val(1);

      var currDate = new Date();
      var currDay = currDate.getDate();
      var currMonth = (currDate.getMonth() + 1);
      var currYear = currDate.getFullYear();

      if(currDay < 10){
        currDay = "0"+currDay;
      }

      if(currMonth < 10){
        currMonth = "0"+currMonth;
      }

      var formattedDate = currDay+"/"+currMonth+"/"+currYear;

      $(".staying-range")
        .data("daterangepicker")
        .setStartDate(formattedDate);

      $(".staying-range")
        .data("daterangepicker")
        .setEndDate(formattedDate);

      app.navigateToStep(3, 1);
    });
  },
  validateForm:function(minMaxSpaceStay){
    $(".flagForDel").remove();
    $(".space-range-input").parent().css("border","0");
    $(".staying-range").parent().css("border","0");

    var spaceNeeded = parseInt($(".space-range-input").val());

    if((spaceNeeded >= minMaxSpaceStay.minPossibleSpace) && (spaceNeeded <= minMaxSpaceStay.maxPossibleSpace)){
      app.formResults.desiredSpace = spaceNeeded;
    }
    else{
      $(".space-range-input").parent().append(
        $("<span>", {
          "class":"flagForDel",
          "style":"color:red"
        }).text("Must be between "+minMaxSpaceStay.minPossibleSpace+" and "+minMaxSpaceStay.maxPossibleSpace)
      ).css("border","2px solid red");
    }

    var stayingFrom = app.formResults.stayingFrom,
        stayingTill = app.formResults.stayingTill;

    // If the values are defined
    if(stayingFrom && stayingTill){
      // Convert the string values into arrays
      var fromSplit = stayingFrom.split("-"),
          tillSplit = stayingTill.split("-");

      // The values must be converted back into Date objects to get the days and the month
      // the string values in each array are converted to numerical values as browsers
      // parse strings into dates differently.
      var fromDate = new Date(parseInt(fromSplit[0]),parseInt(fromSplit[1]),parseInt(fromSplit[2])),
          tillDate = new Date(parseInt(tillSplit[0]),parseInt(tillSplit[1]),parseInt(tillSplit[2]));

      // Get the difference between the two dates; this will return the difference in milliseconds
      var dateDiff = (tillDate - fromDate);

      // We want the days, so convert the milliseconds to days through division
      // Val / Milliseconds / Seconds / Minutes / Hours = days
      var days = (((((dateDiff / 1000) / 60) / 60) / 24));

      if((days >= minMaxSpaceStay.minPossibleStay) && (days <= minMaxSpaceStay.maxPossibleStay)){
        app.formResults.desiredDays = days;
      }
      else{
        $(".staying-range").parent().css("border","2px solid red").append(
          $("<span>", {
            "class":"flagForDel",
            "style":"color:red"
          }).text("Days must be between "+minMaxSpaceStay.minPossibleStay+" and "+minMaxSpaceStay.maxPossibleStay)
        );
      }
    }
    else{
      $(".staying-range").parent().css("border","2px solid red").append(
        $("<span>", {
          "class":"flagForDel",
          "style":"color:red"
        }).text("Days must be between "+minMaxSpaceStay.minPossibleStay+" and "+minMaxSpaceStay.maxPossibleStay)
      );
    }

    var desiredSpace = app.formResults.desiredSpace,
        desiredDays = app.formResults.desiredDays;

    // Validation; the step shouldn't change if either of these values is undefined
    if(desiredSpace && desiredDays){
      // Variables to be used in a future function call
      var hotels, hostels, motels, houses = false;

      var hotelSpace, hotelStay, hostelSpace, hostelStay, motelSpace, motelStay, houseSpace, houseStay;

      // The expressions in these variables return a boolean value
      // This process has been broken down just to make it easier to read and work with
      for(var i = 0; i < app.dataConfig.types.length; i++){
        var prop = app.dataConfig.types[i].properties;

        var minSpace = (desiredSpace >= prop.minSpace),
            maxSpace = (desiredSpace <= prop.maxSpace),
            minStay = (desiredDays >= prop.minStay),
            maxStay = (desiredDays <= prop.maxStay);

        switch(i){
          case 0:
            hotelSpace = (minSpace && maxSpace);
            hotelStay = (minStay && maxStay);

            break;
          case 1:
            hostelSpace = (minSpace && maxSpace);
            hostelStay = (minStay && maxStay);

            break;
          case 2:
            motelSpace = (minSpace && maxSpace);
            motelStay = (minStay && maxStay);

            break;
          case 3:
            houseSpace = (minSpace && maxSpace);
            houseStay = (minStay && maxStay);

            break;
        }
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

      // If there's any popups on the map, remove them.
      // There should not be more than one popup on the map at any time.
      $(".mapboxgl-popup").remove();

      // Reset the view window of the map back to initial.
      // This shouldn't change anything if the map hasn't been touched yet.
      app.mapbox.map.setCenter(app.mapbox.config.initCenter);
      app.mapbox.map.setZoom(app.mapbox.config.initZoom);

      // Clear the HTML below the map
      $(".location-info > .col-9").children().html("");
      $(".location-info > .d-flex").html("");

      app.mapbox.createMarkers(hotels, hostels, motels, houses);

      $(".desired-space-val").text(desiredSpace);

      var daysText = "days";

      if(desiredDays == 1){
        daysText = "day";
      }

      $(".desired-days-val").text(desiredDays+" "+daysText);

      app.navInitLeft = parseInt($(".curr-step").css("left"));

      app.navigateToStep(1, 2);

      app.mapbox.map.resize();
    }
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
  navigateToStep:function(fromStep, toStep){
    function stepTo(step){
      switch(step){
        case 1:
          $(".step-1").removeClass("d-none");
          $(".step-2, .step-3").addClass("d-none");

          app.navCurrStep = 1;

          break;
        case 2:
          $(".step-1, .step-3").addClass("d-none");
          $(".step-2").removeClass("d-none");

          app.navCurrStep = 2;

          break;
        case 3:
          $(".step-1, .step-2").addClass("d-none");
          $(".step-3").removeClass("d-none");

          app.navCurrStep = 3;

          break;
      }
    }

    switch(fromStep){
      case 3:
        // Any navigation from step 3 will be lower; so no need for validation
        stepTo(toStep);

        app.animateNav(toStep, false);

        break;
      case 2:
        // Steps 1 or 3 can be navigated to from step 2
        // Only step 3 needs validation from step 2
        switch(toStep){
          case 1:
            // If the step to switch to is 1 from 2, then no need for validation
            stepTo(1);

            app.animateNav(1, false);

            break;
          case 3:
            // From step 2 to step 3, validate that a value exists. If not, do nothing.
            if(app.formResults.desiredLocation){
              stepTo(3);

              app.animateNav(3, true);
            }

            break;
        }

        break;
      case 1:
        // Steps 2 or 3 can be navigated to from step 1
        // Both steps need validation, though step 3 will need validation of both 1 & 2
        switch(toStep){
          case 2:
            // From step 1 to step 2; validate that a value exists. If not, do nothing.
            if(app.formResults.desiredDays){
              stepTo(2);

              app.animateNav(2, true);
            }

            break;
          case 3:
            // From step 1 to step 3; both values need to exist. If not, do nothing.
            if(app.formResults.desiredDays){
              if(app.formResults.desiredLocation){
                stepTo(3);

                app.animateNav(3, true);
              }
            }

            break;
        }
    }
  },
  animateNav:function(step, up){
    clearInterval(app.navTransition);

    if(step < 0){
      step = 0;
    }

    // Animation for the navbar
    var currStep = $(".curr-step"),
        animSpeed = 6;

    if(up){
      app.navTransition = setInterval(function(){
        var currStepLeft = parseInt($(currStep).css("left")),
            adjWidth = parseInt($(".main-navbar .col-sm div").css("width")),
            desiredLeft = app.navInitLeft + (adjWidth * (step-1));

        if(currStepLeft < desiredLeft){
          $(currStep).css("left",currStepLeft+animSpeed+"px");
        }
        else{
          $(currStep).css("left",desiredLeft);
          clearInterval(app.navTransition);
        }
      }, 1);
    }
    else{
      app.navTransition = setInterval(function(){
        var currStepLeft = parseInt($(currStep).css("left")),
            adjWidth = parseInt($(".main-navbar .col-sm div").css("width")),
            desiredLeft = app.navInitLeft + (adjWidth *  (step-1));

        if(currStepLeft >  desiredLeft){
          $(currStep).css("left",currStepLeft-animSpeed+"px");
        }
        else{
          $(currStep).css("left",desiredLeft);
          clearInterval(app.navTransition);
        }
      }, 1);
    }
  }
};

$(document).ready(function(){
  app.init();
});
