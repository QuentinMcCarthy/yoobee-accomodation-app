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
      var minPossibleSpace = types[0].properties.minSpace,
          maxPossibleSpace = types[1].properties.maxSpace,
          minPossibleStay = types[0].properties.maxStay,
          maxPossibleStay = types[3].properties.maxStay;

      // For loop ensures the variables above are correct
      for(var i = 0; i < types.length; i++){
        var currMinSpace = types[i].properties.minSpace,
            currMaxSpace = types[i].properties.maxSpace,
            currMinStay = types[i].properties.minStay,
            currMaxStay = types[i].properties.maxStay,

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
        "min":minPossibleStay,
        "max":maxPossibleStay
      }).on("input",function(){
        // The slider and the input should always have the same value
        $(".space-range-slider").val($(this).val());
      });

      $(".staying-range").daterangepicker({
        drops:"up",
        opens:"center",
        startDate:new Date(),
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
          $(".space-range-input").append(
            $("<span>")
              .addClass("flagForDel")
              .text("Must be between "+minPossibleSpace+" and "+maxPossibleSpace)
              .css("color","darkred")
          ).parent().css("border","2px solid red");
        }

        var stayingFrom = app.formResults.stayingFrom,
            stayingTill = app.formResults.stayingTill;

        // If the values are defined
        if((stayingFrom) && (stayingTill)){
          // The values must be converted back into Date objects to get the days
          var fromDays = (new Date(stayingFrom)).getDate(),
              tillDays = (new date(stayingTill)).getDate();

          var days = (tillDates - fromDays);

          if((days >= minPossibleStay) && (days <= maxPossibleStay)){
            app.formResults.desiredDays = days;
          }
          else{
            $(".staying-range").parent().css("border","2px solid red").append(
              $("<span>")
                .addClass("flagForDel")
                .text("Days must be between "+minPossibleStay+" and "+maxPossibleStay)
                .css("color","darkred")
            );
          }
        }
        else{
          $(".staying-range").parent().css("border","2px solid red");
        }

        var desiredSpace = app.formResults.desiredSpace,
            desiredDays = app.formResults.desiredDays;

        // Validation; the step shouldn't change if either of these values is undefined
        if((desiredSpace) && (desiredDays)){
          var hotels, hostels, motels, houses = false;

          // The expressions in these variables return a boolean value
          // This process has been broken down just to make it easier to read and work with
          for(var i = 0; i < types.length; i++){
            var prop = types[i].properties

            var minSpace = (desiredSpace >= prop.minSpace),
                maxSpace = (desiredSpace <= prop.maxSpace),
                minStay = (desiredDays >= prop.minStay),
                maxStay = (desiredDays <= prop.maxStay);
          }
        }
      })
    });
  },
  sortData:function(data){},
  animateNav:function(step){}
}

$(document).ready(function(){
  app.init();
});
