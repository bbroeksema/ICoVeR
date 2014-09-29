'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ScatterplotCtrl', function($scope, $window, $element, DataSet, R) {
    var sp = ScatterPlot("#scatterplotDiv");
    $scope.squareScatterplotSides = false;  // if through both hiehgt and width shiuld be the same
     sp.width(200).height(200);
    LoadScatterPlotDataTest("./calibrate.json");
     $scope.scatterPlotDataType = "All";
     
     $scope.scatterDataTypes = ["row", "column","All"];
    var sWidth = $element[0].clientWidth;
    var sHeight = $element[0].clientWidth;
        
    function resize() {
      var sp_data = sp.data();
      if(sp_data){
        
       //  var sWidth = $element[0].clientWidth;
       // var sHeight = $element[0].clientWidth;
       //  if( sWidth >1 && sHeight > 1) {
       //   sp.width(sWidth).height(sHeight - 60);
       //  }
       // else {
       //  setInitialScatterPlotSize();
       // }
        setInitialScatterPlotSize();
        sp.draw();
      }
    }
  
    $scope.$on("DataSet::ScatterDataLoaded", function(ev, data) {
      sp.data(data);
      sp.draw();
    });
  
  
   function setInitialScatterPlotSize() {
     // the issue is that if the scatter plot is not 
     // onscreen when the resize is draw the containineg elemnt size
     //is zero
     // if the scatter plot is on screen it appear to resize ok
     // so basically i have spent way too much time to get this working
     // and have given up.... so if the  container element with or height
     // is zero i draw the scatterplot at 35% of the screen height
     // and 50 % of its width
     var w_width = window.innerWidth;
     var w_height = window.innerHeight;
      sp.width(w_width * 0.50).height(w_height * 0.35);
     
   }
    function LoadScatterPlotDataTest(filename) {
    // this function is used to associate ui interactions with the data
    // the LoadScatterPlotData loads the data without attaching items from this test UI
    d3.json(filename, function(error, data) {
      if(!error) {
        if(data.hasOwnProperty("dataItems")) {
          sp.data(data);
          resize();
        } else {
          console.log(" Invalid file data : no Data ITems Property    filename = " + filename);
        } 
      }else {
        console.log(" error loading file: " + error + "    filename = " + filename);
      }
    });
  }
  
  function toggleSquareSides() {
   if(sp.data()) {
     $scope.squareScatterplotSides !=  $scope.squareScatterplotSides;
      if(  $scope.squareScatterplotSides) {
        var smallestSide = d3.min([sp.width(), sp.height()]);
        sp.width(smallestSide).height(smallestSide);
        sp.draw();     
      }else{
         setInitialScatterPlotSize();
         sp.draw();
      }
    }
  }

function onDataTypeChange(){
    console.log("Scatter Plot Data Type Changed");
}
  angular.element($window).bind('resize', resize);
  $(document).ready(resize);
  $scope.$watch('scatterPlotDataType', onDataTypeChange);
   $scope.$watch('squareScatterplotSides', toggleSquareSides);


});
