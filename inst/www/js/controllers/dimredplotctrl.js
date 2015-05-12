/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, list, d3, ocpu, _, $*/

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $element, $window, DimRedPlot) {
    'use strict';
    /*jslint unparam:true*/

    var dimredplot = [];

    function resize() {
      d3.select($element[0]).selectAll("div.dimredplot")
        .style("width", 100 / dimredplot.length + "%")
        .style("height", "100%")
        .each(function (d, i) {
          /*jslint unparam:true*/
          dimredplot[i]
            .width($element[0].clientWidth / dimredplot.length)
            .height($element[0].clientHeight);
          dimredplot[i](d3.select(this));
        });
    }

    function changeSelection() {
      d3.select($element[0]).selectAll("div.dimredplot")
        .each(function (d, i) {
          /*jslint unparam:true*/
          dimredplot[i](d3.select(this));
        });
    }

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    $scope.$on("DimRedPlot::selectionUpdated", function () {
      dimredplot.forEach(function (d) {
        d.individualSelections(DimRedPlot.selections.individual);
        d.variableInfluences(DimRedPlot.influences.variable);
      });

      changeSelection();
    });

    $scope.$on("DimRedPlot::dataLoaded", function (ev) {
      /*jslint unparam:true*/
      var div;

      dimredplot = [];
      DimRedPlot.data.flags = {pointsChanged: true};

      DimRedPlot.data.analyses.forEach(function (datum) {
        var chart = list.DimRedPlot();
        chart
          .originSize(30)
          .originVisible(true)
          .on("changeVariableSelection", function (drp) {
            DimRedPlot.changeVariableSelection(datum.method, drp.variableSelections());

            dimredplot.forEach(function (plot) {
              if (plot !== drp) {
                plot.variableSelections(DimRedPlot.selections.variable);
              }
              plot.individualInfluences(DimRedPlot.influences.individual);
            });

            changeSelection();
          })
          .on("changeIndividualSelection", function (drp) {
            $scope.$apply(function () {
              DimRedPlot.changeIndividualSelection(datum.method, drp.individualSelections());

              dimredplot.forEach(function (plot) {
                if (plot !== drp) {
                  plot.individualSelections(DimRedPlot.selections.individual);
                }
                plot.variableInfluences(DimRedPlot.influences.variable);
              });

              changeSelection();
            });
          })
          .individualSelections(DimRedPlot.selections.individual)
          .variableSelections(DimRedPlot.selections.variable)
          .individualInfluences(DimRedPlot.influences.individual)
          .variableInfluences(DimRedPlot.influences.variable);
        dimredplot.push(chart);
      });

      div = d3.select($element[0]).selectAll("div.dimredplot").data(DimRedPlot.data.analyses);
      div.enter()
        .append("div")
        .attr("class", "dimredplot");

      resize();

      div.exit().remove();
    });
  });
