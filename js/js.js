var app = {
	dataConfig:{},
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
		});


		$(".currStep").css("width",$(".main-navbar .col-sm div").css("width"));
		$(".currStep").css("height",$(".main-navbar .col-sm div").css("height"));

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

		$(".detailSubmit").click(function(){});

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

						var listingData = $("<h5>").text(prop.name).appendTo(locationInfo);
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
	},
	sortData:function(data){
		if(data.length){
			var count = {
				a:[],
				b:[],
				c:[],
				d:[],
				e:[],
				f:[],
				g:[],
				h:[],
				i:[],
				j:[],
				k:[],
				l:[],
				m:[],
				n:[],
				o:[],
				p:[],
				q:[],
				r:[],
				s:[],
				t:[],
				u:[],
				v:[],
				w:[],
				x:[],
				y:[],
				z:[],
				num:[]
			};

			for(var i = 0; i < data.length; i++){
				var char = data[i].properties.name.split("")[0].toLowerCase();

				switch(char){
					case "a":
						count.a.push(i);
						break;
					case "b":
						count.b.push(i);
						break;
					case "c":
						count.c.push(i);
						break;
					case "d":
						count.d.push(i);
						break;
					case "e":
						count.e.push(i);
						break;
					case "f":
						count.f.push(i);
						break;
					case "g":
						count.g.push(i);
						break;
					case "h":
						count.h.push(i);
						break;
					case "i":
						count.i.push(i);
						break;
					case "j":
						count.j.push(i);
						break;
					case "k":
						count.k.push(i);
						break;
					case "l":
						count.l.push(i);
						break;
					case "m":
						count.m.push(i);
						break;
					case "n":
						count.n.push(i);
						break;
					case "o":
						count.o.push(i);
						break;
					case "p":
						count.p.push(i);
						break;
					case "q":
						count.q.push(i);
						break;
					case "r":
						count.r.push(i);
						break;
					case "s":
						count.s.push(i);
						break;
					case "t":
						count.t.push(i);
						break;
					case "u":
						count.u.push(i);
						break;
					case "v":
						count.v.push(i);
						break;
					case "w":
						count.w.push(i);
						break;
					case "x":
						count.x.push(i);
						break;
					case "y":
						count.y.push(i);
						break;
					case "z":
						count.z.push(i);
						break;
					default:
						count.num.push(i);
				}
			}

			var sortedArray = [];

			if(count.num.length == 1){
				sortedArray.push(data[count.num])
			}
			else if(count.num > 0){

			}

			sortedArray.sort();

			if(count.a.length == 1){
				sortedArray.push(data[count.a]);
			}
			else if(count.a.length > 0){

			}

			if(count.b.length == 1){
				sortedArray.push(data[count.b]);
			}
			else if(count.b.length > 0){

			}

			if(count.c.length == 1){
				sortedArray.push(data[count.c]);
			}
			else if(count.c.length > 0){

			}

			if(count.d.length == 1){
				sortedArray.push(data[count.d]);
			}
			else if(count.d.length > 0){

			}

			if(count.e.length == 1){
				sortedArray.push(data[count.e]);
			}
			else if(count.e.length > 0){

			}

			if(count.f.length == 1){
				sortedArray.push(data[count.f]);
			}
			else if(count.f.length > 0){

			}

			if(count.g.length == 1){
				sortedArray.push(data[count.g]);
			}
			else if(count.g.length > 0){

			}

			if(count.h.length == 1){
				sortedArray.push(data[count.h]);
			}
			else if(count.h.length > 0){

			}

			if(count.i.length == 1){
				sortedArray.push(data[count.i]);
			}
			else if(count.i.length > 0){

			}

			if(count.j.length == 1){
				sortedArray.push(data[count.j]);
			}
			else if(count.j.length > 0){

			}

			if(count.k.length == 1){
				sortedArray.push(data[count.k]);
			}
			else if(count.k.length > 0){

			}

			if(count.l.length == 1){
				sortedArray.push(data[count.l]);
			}
			else if(count.l.length > 0){

			}

			if(count.m.length == 1){
				sortedArray.push(data[count.m]);
			}
			else if(count.m.length > 0){
				var chars = data[count.m[0]].properties.name.toLowerCase().split("");

				function numberChars(chars){
					var numberedChars = [];

					for(var i = 0; i < chars.length; i++){
						switch(chars[i]){
							case "a":
								numberedChars.push(1);
								break;
							case "b":
								numberedChars.push(2);
								break;
							case "c":
								numberedChars.push(3);
								break;
							case "d":
								numberedChars.push(4);
								break;
							case "e":
								numberedChars.push(5);
								break;
							case "f":
								numberedChars.push(6);
								break;
							case "g":
								numberedChars.push(7);
								break;
							case "h":
								numberedChars.push(8);
								break;
							case "i":
								numberedChars.push(9);
								break;
							case "j":
								numberedChars.push(10);
								break;
							case "k":
								numberedChars.push(11);
								break;
							case "l":
								numberedChars.push(12);
								break;
							case "m":
								numberedChars.push(13);
								break;
							case "n":
								numberedChars.push(14);
								break;
							case "o":
								numberedChars.push(15);
								break;
							case "p":
								numberedChars.push(16);
								break;
							case "q":
								numberedChars.push(17);
								break;
							case "r":
								numberedChars.push(18);
								break;
							case "s":
								numberedChars.push(19);
								break;
							case "t":
								numberedChars.push(20);
								break;
							case "u":
								numberedChars.push(21);
								break;
							case "v":
								numberedChars.push(22);
								break;
							case "w":
								numberedChars.push(23);
								break;
							case "x":
								numberedChars.push(24);
								break;
							case "y":
								numberedChars.push(25);
								break;
							case "z":
								numberedChars.push(26);
								break;
							default:
								numberedChars.push(0);
						}
					}

					return numberedChars;
				}

				var charNums = [numberChars(chars)]

				count.m.forEach(function(currentValue,index){
					if(index != 0){
						var charsCompare = data[currentValue].properties.name.toLowerCase().split("");

						charNums.push(numberChars(charsCompare));
					}
				});

				console.log(charNums);

				charNums[0].forEach(function(currentValue,index){
					var lowerNum;

					for(var i = 0; i < charNums.length; i++){

					}
				});
			}

			// console.log(count);
			// console.log(sortedArray);
		}
		else{
			console.log("Data is not array");

		}
		return data;
	}
};

$(document).ready(function(){
	app.init();
});
