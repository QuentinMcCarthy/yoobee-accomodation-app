var app = {
  locationData:{},
  dataConfig:{},
  formResults:{},
  navInitLeft:undefined,
  mapbox:{
    map:null,
    initMapbox:function(){},
    mapSubmit:function(e){},
    writeLocationData:function(prop, index){},
    createMarkers:function(hotels,hostels,motels,houses){},
    buildLocationList:function(data){},
    flyToStore:function(currentFeature){},
    createPopUp:function(currentFeature){}
  },
  init:function(){
    $.getJSON("assets/dataConfig.json", function(data){
      app.dataConfig = data;

      var types = app.dataConfig.types;

      // Values here are manually set but may not be correct
      var minPossibleSpace = types[0].properties.minSpace;
      var maxPossibleSpace = types[1].properties.maxSpace;
      var minPossibleStay = types[0].properties.maxStay;
      var maxPossibleStay = types[3].properties.maxStay;

      // For loop ensures the variables above are correct
      for(var i = 0; i < types.length; i++){
        var currMinSpace = types[i].properties.minSpace;
        var currMaxSpace = types[i].properties.maxSpace;
        var currMinStay = types[i].properties.minStay;
        var currMaxStay = types[i].properties.maxStay;

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

    });
  },
  sortData:function(data){},
  animateNav:function(step){}
}

$(document).ready(function(){
  app.init();
});
