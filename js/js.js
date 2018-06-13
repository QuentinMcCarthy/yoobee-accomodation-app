var accomodation = {
	"types":[
		{
			"type":"hotel",
			"properties":{
				"minSpace":1,
				"maxSpace":2,
				"costNightly":157,
				"minStay":1,
				"maxStay":5
			}
		},
		{
			"type":"hostel",
			"properties":{
				"minSpace":1,
				"maxSpace":6,
				"costNightly":30,
				"minStay":1,
				"maxStay":10
			}
		},
		{
			"type":"motel",
			"properties":{
				"minSpace":2,
				"maxSpace":4,
				"costNightly":90,
				"minStay":3,
				"maxStay":10
			}
		},
		{
			"type":"house",
			"properties":{
				"minSpace":1,
				"maxSpace":4,
				"costNightly":240,
				"minStay":2,
				"maxStay":15
			}
		}
	]
};

var app = {
	spaceNeeded:undefined,
	stayingFrom:undefined,
	stayingTill:undefined,
	init:function(){
		// console.log(accomodation);

		var minPossibleSpace = accomodation.types[0].properties.minSpace;
		var maxPossibleSpace = accomodation.types[0].properties.maxSpace;
		var minPossibleStay = accomodation.types[0].properties.minStay;
		var maxPossibleStay = accomodation.types[0].properties.maxStay;

		for(var i = 0; i < accomodation.types.length; i++){
			var currMinSpace = accomodation.types[i].properties.minSpace;
			var currMaxSpace = accomodation.types[i].properties.maxSpace;
			var currMinStay = accomodation.types[i].properties.minStay;
			var currMaxStay = accomodation.types[i].properties.maxStay;


			// console.log("currMinSpace: "+currMinSpace);

			if(currMinSpace < minPossibleSpace){
				// console.log(currMinSpace+" < "+minPossibleSpace);

				minPossibleSpace = currMinSpace;
			}

			// console.log("currMaxSpace: "+currMaxSpace);

			if(currMaxSpace > maxPossibleSpace){
				// console.log(currMaxSpace+" > "+maxPossibleSpace);

				maxPossibleSpace = currMaxSpace;
			}

			// console.log("currMinStay: "+currMinStay);

			if(currMinStay < minPossibleStay){
				// console.log(currMinStay+" < "+minPossibleStay);

				minPossibleStay = currMinStay;
			}

			// console.log("currMaxStay: "+currMaxStay);

			if(currMaxStay > maxPossibleStay){
				// console.log(currMaxStay+" > "+maxPossibleStay);

				maxPossibleStay = currMaxStay;
			}
		}

		// console.log("minPossibleSpace: "+minPossibleSpace);
		// console.log("maxPossibleSpace: "+maxPossibleSpace);
		// console.log("minPossibleStay: "+minPossibleStay);
		// console.log("maxPossibleStay: "+maxPossibleStay);


		$(".currStep").css("width",$(".main-navbar .col-sm div").css("width"));
		$(".currStep").css("height",$(".main-navbar .col-sm div").css("height"));

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

		// console.log(currDate);
		// console.log(year);
		// console.log(month);
		// console.log(day);

		if(month < 10){
			month = "0"+month;
		}

		if(day < 10){
			day = "0"+day;
		}

		$(".stayingFrom").val(year+"-"+month+"-"+day);

		$(".detailSubmit").click(function(){

		});
	}
};

$(document).ready(function(){
	app.init();

	// Mapbox
	mapboxgl.accessToken = 'pk.eyJ1IjoibWNjYXJ0aHlxIiwiYSI6ImNqaTNucHpsMzAwaGczcXF2eDJhbGxwNGwifQ.Qn-qvcjlEmkiLq4lqV435A';
	var map = new mapboxgl.Map({
		container:"map", // container id
		style:"mapbox://styles/mccarthyq/cji9h1jw0124i2sqitzoczzsh",
		center:[171.285471,-41.090805], // starting position
		zoom:4 // starting zoom
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
			var listing = $("<div>", {"className":"item","id":"listing-"+i})
				.append($("<a>", {"href":"#","className":"title","dataPosition":i,})
					.html(prop.address)
					.on("click",function(e){
						// Update the currentFeature to the store associated with the clicked link
						var clickedListing = data.features[$(this).attr("dataPosition")];
						// 1. Fly to the point associated with the clicked link
						flyToStore(clickedListing);
						// 2. Close all other popups and display popup for clicked store
						createPopUp(clickedListing);
						// 3. Highlight listing in sidebar (and remove highlight for all other listings)
						var activeItem = $(".active");
						if(activeItem[0]){
							$(activeItem[0]).removeClass("active");
						}
						$(this.parentNode).addClass("active");
					})
				)
				.append($("<div>").html(prop.city+" &middot; "+prop.phoneFormatted))
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

		var popup = new mapboxgl.Popup({closeOnClick:false})
			.setLngLat(currentFeature.geometry.coordinates)
			.setHTML("<h3>"+currentFeature.properties.name+"</h3>"+"<h4>"+currentFeature.properties.address+"</h4>")
			.addTo(map);
	}
});
