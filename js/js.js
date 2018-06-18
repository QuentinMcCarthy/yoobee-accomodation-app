var app = {
	dataConfig:{},
	formResults:{},
	spaceNeeded:undefined,
	stayingFrom:undefined,
	stayingTill:undefined,
	init:function(){
		$.getJSON("assets/dataConfig.json", function(data){
			app.dataConfig = data;

			var minPossibleSpace = app.dataConfig.types[0].properties.minSpace;
			var maxPossibleSpace = app.dataConfig.types[0].properties.maxSpace;
			var minPossibleStay = app.dataConfig.types[0].properties.minStay;
			var maxPossibleStay = app.dataConfig.types[0].properties.maxStay;

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

			$(".spaceNeededRangeSlider").attr("min",minPossibleSpace);
			$(".spaceNeededRangeSlider").attr("max",maxPossibleSpace);
			$(".spaceNeededRangeInput").attr("min",minPossibleSpace);
			$(".spaceNeededRangeInput").attr("max",maxPossibleSpace);

			$(".spaceNeededRangeSlider").on("input",function(){
				$(".spaceNeededRangeInput").val($(this).val());
			});
			$(".spaceNeededRangeInput").on("input",function(){
				$(".spaceNeededRangeSlider").val($(this).val());
			});

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

				if((stayingFrom) && (stayingTill)){
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

				if((desiredSpace) && (desiredDays)){
					$(".step-1").addClass("d-none");
					$(".step-2").removeClass("d-none");


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

		$(".currStep").css("width",$(".main-navbar .col-sm div").css("width"));
		$(".currStep").css("height",$(".main-navbar .col-sm div").css("height"));

		$(".step-1").show()

		// Mapbox
		mapboxgl.accessToken = 'pk.eyJ1IjoibWNjYXJ0aHlxIiwiYSI6ImNqaTNucHpsMzAwaGczcXF2eDJhbGxwNGwifQ.Qn-qvcjlEmkiLq4lqV435A';
		var map = new mapboxgl.Map({
			container:"map", // container id
			style:"mapbox://styles/mccarthyq/cji9h1jw0124i2sqitzoczzsh",
			center:[174.777623,-41.289632], // starting position
			zoom:12 // starting zoom
		});

		// Add geolocate control to the map.
		map.addControl(new mapboxgl.GeolocateControl({
			positionOptions:{
				enableHighAccuracy:true
			},
			trackUserLocation:true
		}));


		// geojson data for locations
		$.getJSON("assets/accomodation.geojson", function(data){
			var locations = data;

			locations.features = app.sortData(locations.features);

			map.on("load",function(e){
				// Add the data to your map as a layer
				map.addSource("places", {
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
						.addTo(map);

					$(el).on("click",function(e){
						var activeItem = $(".active");
						// 1. Fly to the point
						flyToStore(marker);
						// 2. Close all other popups and display popup for clicked store
						createPopUp(marker);
						// 3. Highlight listin in sidebar (and remove highlight for all other listings)
						e.stopPropagation();
						if(activeItem[0]){
							$(activeItem[0]).removeClass("active");
						}

						// var listing = $("#listing-"+i);
						// $(listing).addClass("active");
					});
				});

				buildLocationList(locations);
			});
		});

		function buildLocationList(data){
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
						flyToStore(clickedListing);
						// 2. Close all other popups and display popup for clicked store
						createPopUp(clickedListing);
						// 3. Highlight listing in sidebar (and remove highlight for all other listings)
						// var activeItem = $(".active");
						// if(activeItem[0]){
							// $(activeItem[0]).removeClass("active");
						// }
						// $(this).addClass("active");

						var prop = data.features[$(this).attr("dataPosition")].properties;

						var locationInfo = $("#locationInfo");

						$(locationInfo).html("");

						$("<h3>").text(prop.name).appendTo(locationInfo);

						switch(prop.type){
							case "hotel":
								$("<div>").text("Nightly Cost: $"+app.dataConfig.types[0].properties.costNightly).appendTo(locationInfo);

								break;
							case "hostel":
								$("<div>").text("Nightly Cost: $"+app.dataConfig.types[1].properties.costNightly).appendTo(locationInfo);

								break
							case "motel":
								$("<div>").text("Nightly Cost: $"+app.dataConfig.types[2].properties.costNightly).appendTo(locationInfo);

								break
							case "house":
								$("<div>").text("Nightly Cost: $"+app.dataConfig.types[3].properties.costNightly).appendTo(locationInfo);

								break
							default:

						};
					})
					// .append($("<div>").html(prop.city+" &middot; "+prop.phoneFormatted))
					.appendTo(listings);
			}
		}

		function flyToStore(currentFeature){
			map.flyTo({
				center:currentFeature.geometry.coordinates,
				zoom:15
			});
		}

		function createPopUp(currentFeature){
			var popUps = $(".mapboxgl-popup");
			// Check if there is already a popup on the map and if so, remove it
			if(popUps[0]){
				popUps[0].remove();
			}

			var popup = new mapboxgl.Popup({closeOnClick:true})
				.setLngLat(currentFeature.geometry.coordinates)
				.setHTML("<h5>"+currentFeature.properties.name+"</h5>"+"<h6>"+currentFeature.properties.address+"</h6>")
				.addTo(map);
		}

		$(".step-2").addClass("d-none");
		$(".step-3").addClass("d-none");
	},
	sortData:function(data){
		var nameArray = [];

		for(var i = 0; i < data.length; i++){
			nameArray.push(data[i].properties.name);
		}

		nameArray.sort();

		var sortedArray = [];

		nameArray.forEach(function(currentValue,index){
			for(var i = 0; i < data.length; i++){
				if(currentValue == data[i].properties.name){
					sortedArray.push(data[i]);
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
