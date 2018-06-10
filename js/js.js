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
}

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
		})

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
}

$(document).ready(function(){
	app.init();

	// Mapbox
	mapboxgl.accessToken = 'pk.eyJ1IjoibWNjYXJ0aHlxIiwiYSI6ImNqaTNucHpsMzAwaGczcXF2eDJhbGxwNGwifQ.Qn-qvcjlEmkiLq4lqV435A';
	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mccarthyq/cji9h1jw0124i2sqitzoczzsh'
	});
});
