var app = {
  locationData:{},
  dataConfig:{},
  formResults:{},
  navInitLeft:undefined,
  mapbox:{
    map:null,
    initMapbox:function(){
      // Mapbox functions for initial setup of mapbox
      mapboxgl.accessToken = 'pk.eyJ1IjoibWNjYXJ0aHlxIiwiYSI6ImNqaTNucHpsMzAwaGczcXF2eDJhbGxwNGwifQ.Qn-qvcjlEmkiLq4lqV435A';
      var map = new mapboxgl.Map({
        container:"map", // container id
        style:"mapbox://styles/mccarthyq/cji9h1jw0124i2sqitzoczzsh",
        center:[174.777623,-41.289632], // starting position
        zoom:12 // starting zoom
      });

      // Keep track of the map as a variable in the app for use later on
      app.mapbox.map = map;

      // Add geolocate control to the map.
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions:{
          enableHighAccuracy:true
        },
        trackUserLocation:true
      }));

      $(window).resize(function(){
        $(".curr-step").css("width",$(".main-navbar .col-sm div").css("width"));
        $(".curr-step").css("height",$(".main-navbar .col-sm div").css("height"));

        map.resize();
      })
    },
    mapSubmit:function(e){
      app.formResults.desiredLocation = app.locationData.features[$(this).attr("data-submit")];

      $(".desired-location").text(app.formResults.desiredLocation.properties.name);
      $(".desired-address").text(app.formResults.desiredLocation.properties.address);
      $(".desired-phone-num").text(app.formResults.desiredLocation.properties.phoneFormatted);

      $(".desired-space").text(app.formResults.desiredSpace);
      $(".desired-days").text(app.formResults.desiredDays);

      if(app.formResults.desiredLocation.properties.type == "hotel"){
        $(".desired-cost").text("$"+app.dataConfig.types[0].properties.costNightly+" / Night")
      }
      if(app.formResults.desiredLocation.properties.type == "hostel"){
        $(".desired-cost").text("$"+app.dataConfig.types[1].properties.costNightly+" / Night")
      }
      if(app.formResults.desiredLocation.properties.type == "motel"){
        $(".desired-cost").text("$"+app.dataConfig.types[2].properties.costNightly+" / Night")
      }
      if(app.formResults.desiredLocation.properties.type == "house"){
        $(".desired-cost").text("$"+app.dataConfig.types[3].properties.costNightly+" / Night")
      }

      // Switch the steps. Bootstrap display class used.
      $(".step-2").addClass("d-none");
      $(".step-3").removeClass("d-none");

      app.animateNav(3);
    },
    writeLocationData:function(prop, index){
      $(".location-info div.col-9 h4").text(prop.name);
      $(".location-info div.col-9 span").html("<strong>Ph#:</strong> "+prop.phoneFormatted);

      switch(prop.type){
        case "hotel":
        $(".location-info div.col-9 div").html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[0].properties.costNightly);

        break;
        case "hostel":
        $(".location-info div.col-9 div").html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[1].properties.costNightly);

        break
        case "motel":
        $(".location-info div.col-9 div").html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[2].properties.costNightly);

        break
        case "house":
        $(".location-info div.col-9 div").html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[3].properties.costNightly);

        break
      };

      $(".location-info div.d-flex").html("")

      $(".location-info div.d-flex").append(
        $("<button>")
        .addClass("btn btn-primary mapSubmit")
        .attr("data-submit",index)
        .attr("type","submit")
        .text("Confirm")
        .on("click",app.mapbox.mapSubmit)
      );
    },
    createMarkers:function(hotels,hostels,motels,houses){
      // Object to imitate geojson data structure
      var locations = {
        "type":"FeatureCollection",
        "features":[]
      };

      var features = app.locationData.features;

      for(var i = 0; i < features.length; i++){
        var currType = features[i].properties.type;

        if((hotels && currType == "hotel") || (hostels && currType == "hostel") || (motels && currType == "motel") || (houses && currType == "house")){
          locations.features.push(features[i])
        }
      }

      // Add the data to your map as a layer
      app.mapbox.map.addSource("places", {
        type:"geojson",
        data:locations
      });

      locations.features.forEach(function(marker,index){
        // Create a div element for the marker
        // Non-jQuery creation as mapbox code is not very supportive
        var el = document.createElement("div");
        $(el).attr("dataPosition",index);
        // Add a class called "marker" to each div
        el.className = "marker";
        // By default the image for your custom marker will be anchored
        // by its center. Adjust the positoon accordingly
        // Create the custom markers, set their position and add to map
        new mapboxgl.Marker(el, {offset:[0,-23]})
        .setLngLat(marker.geometry.coordinates)
        .addTo(app.mapbox.map);

        $(el).on("click",function(e){
          var activeItem = $(".active");
          // 1. Fly to the point
          app.mapbox.flyToStore(marker);
          // 2. Close all other popups and display popup for clicked store
          app.mapbox.createPopUp(marker);
          // 3. Highlight listin in sidebar (and remove highlight for all other listings)
          e.stopPropagation();
          if(activeItem[0]){
            $(activeItem[0]).removeClass("active");
          }

          // var listing = $("#listing-"+i);
          // $(listing).addClass("active");

          var thisIndex;

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
      // Iterate through the list of stores
      for(var i = 0; i < data.features.length; i++){
        var currentFeature = data.features[i];
        // Shorten data.feature.properties to just "prop" so we're not writing
        // this long form over and over again.
        var prop = currentFeature.properties;
        // Select the listing container in the HTML and append a div
        // with the class "item" for each store
        var listings = $("#listings");
        var listing = $("<a>", {"class":"dropdown-item","href":"#","id":"listing-"+i,"dataPosition":i})
        .html(prop.name)
        .on("click",function(){
          // Update the currentFeature to the store associated with the clicked link
          var clickedListing = data.features[$(this).attr("dataPosition")];
          // 1. Fly to the point associated with the clicked link
          app.mapbox.flyToStore(clickedListing);
          // 2. Close all other popups and display popup for clicked store
          app.mapbox.createPopUp(clickedListing);
          // 3. Highlight listing in sidebar (and remove highlight for all other listings)
          // var activeItem = $(".active");
          // if(activeItem[0]){
          // $(activeItem[0]).removeClass("active");
          // }
          // $(this).addClass("active");

          var thisIndex = $(this).attr("dataPosition");

          app.mapbox.writeLocationData(data.features[thisIndex].properties, thisIndex);
        })
        // .append($("<div>").html(prop.city+" &middot; "+prop.phoneFormatted))
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
      // Check if there is already a popup on the map and if so, remove it
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

      // Values here are manually set but may not be correct
      var minPossibleSpace = app.dataConfig.types[0].properties.minSpace;
      var maxPossibleSpace = app.dataConfig.types[1].properties.maxSpace;
      var minPossibleStay = app.dataConfig.types[0].properties.minStay;
      var maxPossibleStay = app.dataConfig.types[3].properties.maxStay;

      // For loop ensures the variables above are correct
      for(var i = 0; i < app.dataConfig.types.length; i++){
        var currMinSpace = app.dataConfig.types[i].properties.minSpace;
        var currMaxSpace = app.dataConfig.types[i].properties.maxSpace;
        var currMinStay = app.dataConfig.types[i].properties.minStay;
        var currMaxStay = app.dataConfig.types[i].properties.maxStay;

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
      $(".space-range-slider").attr("min",minPossibleSpace);
      $(".space-range-slider").attr("max",maxPossibleSpace);
      $(".space-range-input").attr("min",minPossibleSpace);
      $(".space-range-input").attr("max",maxPossibleSpace);

      // The slider and the input should always have the same value
      $(".space-range-slider").on("input",function(){
        $(".space-range-input").val($(this).val());
      });
      $(".space-range-input").on("input",function(){
        $(".space-range-slider").val($(this).val());
      });

      // As a default; the initial date is the current date
      var currDate = new Date();

      $(".staying-range").daterangepicker({
        drops:"up",
        opens:"center",
        startDate:currDate,
        maxSpan:{
          days:maxPossibleStay
        }
      }, function(start, end, label){
        app.formResults.stayingFrom = start.format("YYYY-MM-DD");
        app.formResults.stayingTill = end.format("YYYY-MM-DD");
      });

      $(".detail-submit").click(function(e){
        // Prevent page reload
        e.preventDefault();

        $(".flagForDel").remove();
        $(".space-range-input").parent().css("border","0px");
        $(".staying-range").parent().css("border","0px");

        var spaceNeeded = parseInt($(".space-range-input").val());

        if((spaceNeeded >= minPossibleSpace) && (spaceNeeded <= maxPossibleSpace)){
          app.formResults.desiredSpace = spaceNeeded;
        }
        else{
          $(".space-range-input").parent().css("border","2px solid red");
          $(".space-range-input").parent().append(
            $("<span class='flagForDel'>").text("Must be between "+minPossibleSpace+" and "+maxPossibleSpace).css("color","darkred")
          );
        }

        var stayingFrom = app.formResults.stayingFrom;
        var stayingTill = app.formResults.stayingTill;

        // If the values are defined
        if((stayingFrom) && (stayingTill)){
          // The values must be converted back into Date objects to get the days
          var fromDays = (new Date(stayingFrom)).getDate();
          var tillDays = (new Date(stayingTill)).getDate();

          var days = (tillDays - fromDays);

          if((days >= minPossibleStay) && (days <= maxPossibleStay)){
            app.formResults.desiredDays = days;
          }
          else{
            $(".staying-range").parent().css("border","2px solid red").append(
              $("<span class='flagForDel'>").text("Days must be between "+minPossibleStay+" and "+maxPossibleStay).css("color","darkred")
            );
          }
        }
        else{
          $(".staying-range").parent().css("border","2px solid red");
        }

        var desiredSpace = app.formResults.desiredSpace;
        var desiredDays = app.formResults.desiredDays;

        // Validation; the step shouldn't change if either of these values is undefined
        if((desiredSpace) && (desiredDays)){
          var hotels = false;
          var hostels = false;
          var motels = false;
          var houses = false;

          var types = app.dataConfig.types

          // The expressions in these variables return a boolean value
          // This process has been broken down just to make it easy to read and work with
          for(var i = 0; i < types.length; i++){
            var minSpace = (desiredSpace >= types[i].properties.minSpace);
            var maxSpace = (desiredSpace <= types[i].properties.maxSpace);
            var minStay = (desiredSpace >= types[i].properties.minStay);
            var maxStay = (desiredSpace <= types[i].properties.maxStay);

            switch(i){
              case 0:
              var hotelSpace = (minSpace && maxSpace);
              var hotelStay = (minStay && maxStay);

              break;
              case 1:
              var hostelSpace = (minSpace && maxSpace);
              var hostelStay = (minStay && maxStay);

              break;
              case 2:
              var motelSpace = (minSpace && maxSpace);
              var motelStay = (minStay && maxStay);

              break;
              case 3:
              var houseSpace = (minSpace && maxSpace);
              var houseStay = (minStay && maxStay);

              break;
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

          app.mapbox.createMarkers(hotels,hostels,motels,houses)

          $(".desired-space-val").text(desiredSpace);

          var daysText = "days"

          if(desiredDays == 1){
            daysText = "day"
          }

          $(".desired-days-val").text(desiredDays+"	"+daysText);

          // Switch the steps. Bootstrap display class used.
          $(".step-1").addClass("d-none");
          $(".step-2").removeClass("d-none");

          app.mapbox.map.resize();

          app.navInitLeft = parseInt($(".curr-step").css("left"));

          app.animateNav(2)
        }
      });
    });

    $.getJSON("assets/accomodation.geojson", function(data){
      var locations = data;

      locations.features = app.sortData(locations.features);

      app.locationData = locations;

      app.mapbox.initMapbox();

      // All steps are visible initially to allow proper loading of elements such as mapbox
      // If the steps were hidden initially, certain elements would not style themselves properly.
      $(".step-2").addClass("d-none");
      $(".step-3").addClass("d-none");

      // This code is just for development purposes and should be removed later on
      // console.log("Dev Mode");
      // app.formResults.desiredSpace = 5;
      // app.formResults.desiredDays = 5;
      // app.formResults.desiredLocation = app.locationData.features[2];
      // $(".desired-space-val").text(app.formResults.desiredSpace);
      // $(".desired-days-val").text(app.formResults.desiredDays);
      // $(".step-1").addClass("d-none");
      // $(".step-2").removeClass("d-none");
      // $(".curr-step").css("left",((parseInt($(".curr-step").css("left")))+(parseInt($(".main-navbar .col-sm div").css("width"))))+"px");
      // app.mapbox.map.on("load",function(){app.mapbox.createMarkers(false,true,false,false)});
    });

    $(".curr-step").css("width",$(".main-navbar .col-sm div").css("width"));
    $(".curr-step").css("height",$(".main-navbar .col-sm div").css("height"));

    $(".final-confirm").on("click",function(){
      // location.reload() is the easiest way to reset the page; as other methods would require resetting
      // the mapbox map and the process for doing so is complicated
      location.reload();
    })
  },
  sortData:function(data){
    var nameArray = [];

    // Push the names of all the places into an array to sort alphabetically
    for(var i = 0; i < data.length; i++){
      nameArray.push(data[i].properties.name);
    }

    nameArray.sort();

    var sortedArray = [];

    // Compare the sorted names against the values in the data; then sort the data based on the names by
    // pushing them into another array in order.
    nameArray.forEach(function(currentValue,index){
      for(var i = 0; i < data.length; i++){
        if(currentValue == data[i].properties.name){
          sortedArray.push(data[i]);

          // continue from the start after finding the name and pushing the data
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

    // Animation for the navbar.
    var currStep = $(".curr-step");

    var transition = setInterval(function(){
      var currStepLeft = parseInt($(currStep).css("left"));
      var adjWidth = parseInt($(".main-navbar .col-sm div").css("width"));

      var desiredLeft = app.navInitLeft + (adjWidth * (step-1));

      if(currStepLeft < desiredLeft){
        $(currStep).css("left",currStepLeft+2+"px");
      }
      else{
        $(currStep).css("left",desiredLeft);
        clearInterval(transition);
      }
    }, 1)
  }
};

$(document).ready(function(){
  app.init();
});
