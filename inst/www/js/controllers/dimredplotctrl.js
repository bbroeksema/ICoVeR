'use strict';

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $element, $window, OpenCPU) {

    var plot = crpgl.DimRedPlot(),
        data = undefined,
        pair = 1;

    plot
      .originSize(30);
      .originVisible(true);

    function resize() {
      plot
        .width($element[0].clientWidth)
        .height($element[0].clientHeight);
      d3.select($element[0]).call(plot);
    }
    
    function updatePlot(session, dimRedData) {
      data = dimRedData;
      data.actives = [pair, pair + 1];
      // TODO: Introduce various ways to 'cut' the number of principal axes.
      //       Various approaches could be taken, such as taking the axes upto
      //       a certain amount of explained variances or retaint only the
      //       first N principal axes. In both cases the variance and N should
      //       be configurable by the user.
      //data.explainedVariance = data.explainedVariance.slice(0, 10);

      d3.select($element[0])
        .datum(data)
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
