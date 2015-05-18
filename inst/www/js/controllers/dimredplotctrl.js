/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, list, d3, ocpu, _, $*/

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $element, $window, DimRedPlot) {
    'use strict';
    /*jslint unparam:true*/

    var dimredplot = list.DimRedPlot();

    function changeSelection() {
      d3.select($element[0]).selectAll("div.dimredplot").call(dimredplot);
    }

    function resize() {
      var div = d3.select($element[0]).selectAll("div.dimredplot").data([$scope.analysis]);
      div.enter()
        .append("div")
        .attr("class", "dimredplot")
        .style("height", "100%")
        .style("width", "100%");
      dimredplot
        .width(div.node().clientWidth / dimredplot.length)
        .height(div.node().clientHeight);

      changeSelection();
    }

    $scope.$on("DimRedPlot::resize", resize);

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    $scope.$on("DimRedPlot::brushed", function (ev, brushed, method) {
      /*jslint unparam:true*/
      if (method !== $scope.analysis.method[0]) {
        dimredplot.individualSelections(DimRedPlot.selections.individual);
      }
      dimredplot.variableInfluences(DimRedPlot.influences.variable);
      changeSelection();
    });

    $scope.$on("DimRedPlot::variablesSelected", function (ev, method) {
      /*jslint unparam:true*/
      if (method !== $scope.analysis.method[0]) {
        dimredplot.variableSelections(DimRedPlot.selections.variable);
      }
      dimredplot.individualInfluences(DimRedPlot.influences.individual);
      changeSelection();
    });

    $scope.$on("DimRedPlot::selectionUpdated", function () {
      dimredplot
        .individualSelections(DimRedPlot.selections.individual)
        .variableInfluences(DimRedPlot.influences.variable);

      changeSelection();
    });

    function updatePlot() {
      $scope.analysis.flags = {pointsChanged: true};

      dimredplot
        .originSize(30)
        .originVisible(true)
        .on("changeVariableSelection", function (drp) {
          $scope.$apply(function () {
            DimRedPlot.changeVariableSelection($scope.analysis.method[0], drp.variableSelections());
          });
        })
        .on("changeIndividualSelection", function (drp) {
          $scope.$apply(function () {
            DimRedPlot.changeIndividualSelection($scope.analysis.method[0], drp.individualSelections());
          });
        })
        .individualSelections(DimRedPlot.selections.individual)
        .variableSelections(DimRedPlot.selections.variable)
        .individualInfluences(DimRedPlot.influences.individual)
        .variableInfluences(DimRedPlot.influences.variable);

      resize();
    }

    updatePlot();
  });
