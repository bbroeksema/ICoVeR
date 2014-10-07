'use strict';

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $element, $window, OpenCPU) {

    var plot = crpgl.DimRedPlot();
    
    plot
      .originSize(30);
      .originVisible(true);

    function resize() {
      plot
        .width($element[0].clientWidth)
        .height($element[0].clientHeight);
      d3.select($element[0]).call(plot);
    }
    
    function updatePlot(session, json) {
      console.log(json);
      d3.select($element[0])
        .datum(json.plotdata)
        .call(plot);
    }

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    // Draw an empty plot at first.
    d3.json("libs/dimredplot/ca.json", updatePlot);
    
    $scope.$on("Analytics::dimensionalityReduced", function(ev, method, session) {
      var fnName = "dimred." + method + ".plotdata",
          args = { ca: session };
      
      OpenCPU.json(fnName, args, updatePlot)
    })
  });
