var app = {
	locationData:{},
	dataConfig:{},
	formResults:{},
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

			locations.features.forEach(function(marker){
				// Create a div element for the marker
				var el = document.createElement("div");
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

						var prop = data.features[thisIndex].properties;

						$("#locationInfo").html("").append(
							$("<div>")
								.addClass("col-9")
								.append($("<h4>").text(prop.name))
								.append(
									$("<span>").html("<strong>Ph#:</strong> "+prop.phoneFormatted)
								)
						).append(
							$("<div>")
								.addClass("d-flex col align-items-end justify-content-end")
								.append(
									$("<button>")
										.attr("type","submit")
										.attr("data-submit",thisIndex)
										.addClass("btn btn-primary mapSubmit")
										.text("Confirm")
										.on("click",function(e){
											// Prevent the default event from firing
											e.preventDefault();

											app.formResults.desiredLocation = data.features[$(this).attr("data-submit")];

											// Switch the steps. Bootstrap display class used.
											$(".step-2").addClass("d-none");
											$(".step-3").removeClass("d-none");

											// Animation for the navbar.
											var currStep = $(".currStep");
											var initialLeft = parseInt($(currStep).css("left"));

											var transition = setInterval(function(){
												var currStepLeft = parseInt($(currStep).css("left"));
												var adjWidth = parseInt($(".main-navbar .col-sm div").css("width"));

												var desiredLeft = (initialLeft + adjWidth)

												if(currStepLeft < desiredLeft){
													$(currStep).css("left",currStepLeft+2+"px");
												}
												else{
													$(currStep).css("left",desiredLeft);
													clearInterval(transition);
												}
											}, 1)
										})
								)
						);

						switch(prop.type){
							case "hotel":
								$("<div>")
									.html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[0].properties.costNightly)
									.appendTo("#locationInfo div.col-9");

								break;
							case "hostel":
								$("<div>")
									.html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[1].properties.costNightly)
									.appendTo("#locationInfo div.col-9");

								break
							case "motel":
								$("<div>")
									.html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[2].properties.costNightly)
									.appendTo("#locationInfo div.col-9");

								break
							case "house":
								$("<div>")
									.html("<strong>Nightly Cost:</strong> $"+app.dataConfig.types[3].properties.costNightly)
									.appendTo("#locationInfo div.col-9");

								break
							default:

						};
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
			$(".spaceNeededRangeSlider").attr("min",minPossibleSpace);
			$(".spaceNeededRangeSlider").attr("max",maxPossibleSpace);
			$(".spaceNeededRangeInput").attr("min",minPossibleSpace);
			$(".spaceNeededRangeInput").attr("max",maxPossibleSpace);

			// The slider and the input should always have the same value
			$(".spaceNeededRangeSlider").on("input",function(){
				$(".spaceNeededRangeInput").val($(this).val());
			});
			$(".spaceNeededRangeInput").on("input",function(){
				$(".spaceNeededRangeSlider").val($(this).val());
			});

			// As a default; the initial date is the current date
			var currDate = new Date();
			var year = currDate.getFullYear();
			var month = currDate.getMonth() + 1;
			var day = currDate.getDate();

			if(month < 10){
				month = "0"+month;
			}

			if(day < 10){
				day = "0"+day;
			}

			$(".stayingFrom").val(year+"-"+month+"-"+day);

			$(".detailSubmit").click(function(e){
				// Prevent page reload
				e.preventDefault();

				var spaceNeeded = parseInt($(".spaceNeededRangeInput").val());
				var stayingFrom = $(".stayingFrom").val();
				var stayingTill = $(".stayingTill").val();

				if((spaceNeeded >= minPossibleSpace) && (spaceNeeded <= maxPossibleSpace)){
					app.formResults.desiredSpace = spaceNeeded;
				}
				else{
					$(".spaceNeededRangeInput").parent().css("border","2px solid red");
					$("label[for='spaceNeeded']").append(
						$("<span>").text("Must be between "+minPossibleSpace+" and "+maxPossibleSpace).css("color","darkred")
					);
				}

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
						$(".stayingFrom").parent().css("border","2px solid red");
						$(".stayingTill").parent().css("border","2px solid red").append(
							$("<span>").text("Days must be between "+minPossibleStay+" and "+maxPossibleStay).css("color","darkred")
						);
					}
				}
				else{
					if(!(stayingFrom)){
						$(".stayingFrom").parent().css("border","2px solid red");
					}
					if(!(stayingTill)){
						$(".stayingTill").parent().css("border","2px solid red");
					}
				}

				var desiredSpace = app.formResults.desiredSpace;
				var desiredDays = app.formResults.desiredDays;

				var hotels = false;
				var hostels = false;
				var motels = false;
				var houses = false;

				// The expressions in these variables return a boolean value
				// This process has been broken down just to make it easy to read and work with
				// 0. Hotel
				var hotelMinSpace = (desiredSpace >= app.dataConfig.types[0].properties.minSpace);
				var hotelMaxSpace = (desiredSpace <= app.dataConfig.types[0].properties.maxSpace);
				var hotelMinStay = (desiredDays >= app.dataConfig.types[0].properties.minStay);
				var hotelMaxStay = (desiredDays <= app.dataConfig.types[0].properties.maxStay);

				var hotelSpace = (hotelMinSpace && hotelMaxSpace);
				var hotelStay = (hotelMinStay && hotelMaxStay);

				// 1. Hostel
				var hostelMinSpace = (desiredSpace >= app.dataConfig.types[1].properties.minSpace);
				var hostelMaxSpace = (desiredSpace <= app.dataConfig.types[1].properties.maxSpace);
				var hostelMinStay = (desiredDays >= app.dataConfig.types[1].properties.minStay);
				var hostelMaxStay = (desiredDays <= app.dataConfig.types[1].properties.maxStay);

				var hostelSpace = (hostelMinSpace && hostelMaxSpace);
				var hostelStay = (hostelMinStay && hostelMaxStay);

				// 2. Motel
				var motelMinSpace = (desiredSpace >= app.dataConfig.types[2].properties.minSpace);
				var motelMaxSpace = (desiredSpace <= app.dataConfig.types[2].properties.maxSpace);
				var motelMinStay = (desiredDays >= app.dataConfig.types[2].properties.minStay);
				var motelMaxStay = (desiredDays <= app.dataConfig.types[2].properties.maxStay);

				var motelSpace = (motelMinSpace && motelMaxSpace);
				var motelStay = (motelMinStay && motelMaxStay);

				// 3. House
				var houseMinSpace = (desiredSpace >= app.dataConfig.types[3].properties.minSpace);
				var houseMaxSpace = (desiredSpace <= app.dataConfig.types[3].properties.maxSpace);
				var houseMinStay = (desiredDays >= app.dataConfig.types[3].properties.minStay);
				var houseMaxStay = (desiredDays <= app.dataConfig.types[3].properties.maxStay);

				var houseSpace = (houseMinSpace && houseMaxSpace);
				var houseStay = (houseMinStay && houseMaxStay);

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

				// Validation; the step shouldn't change if either of these values is undefined
				if((desiredSpace) && (desiredDays)){
					$(".desiredSpaceVal").text(desiredSpace);
					$(".desiredDaysVal").text(desiredDays+"	days");

					// Switch the steps. Bootstrap display class used.
					$(".step-1").addClass("d-none");
					$(".step-2").removeClass("d-none");

					// Animation for the navbar.
					var currStep = $(".currStep");
					var initialLeft = parseInt($(currStep).css("left"));

					var transition = setInterval(function(){
						var currStepLeft = parseInt($(currStep).css("left"));
						var adjWidth = parseInt($(".main-navbar .col-sm div").css("width"));

						var desiredLeft = (initialLeft + adjWidth)

						if(currStepLeft < desiredLeft){
							$(currStep).css("left",currStepLeft+2+"px");
						}
						else{
							$(currStep).css("left",desiredLeft);
							clearInterval(transition);
						}
					}, 1)
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
			console.log("Dev Mode");
			app.formResults.desiredSpace = 5;
			app.formResults.desiredDays = 5;
			app.formResults.desiredLocation = app.locationData.features[2];
			$(".desiredSpaceVal").text(app.formResults.desiredSpace);
			$(".desiredDaysVal").text(app.formResults.desiredDays);
			// $(".step-1").addClass("d-none");
			// $(".step-2").removeClass("d-none");
			// $(".currStep").css("left",((parseInt($(".currStep").css("left")))+(parseInt($(".main-navbar .col-sm div").css("width"))*2))+"px");
			// app.mapbox.map.on("load",function(){app.mapbox.createMarkers(false,true,false,false)});
		});

		$(".currStep").css("width",$(".main-navbar .col-sm div").css("width"));
		$(".currStep").css("height",$(".main-navbar .col-sm div").css("height"));
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
	}
};

$(document).ready(function(){
	app.init();
});
