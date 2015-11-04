/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, list, d3, ocpu, _, $*/

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $element, $window, DimRedPlot, DataSet, Color) {
    'use strict';

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
        .width(div.node().clientWidth)
        .height(div.node().clientHeight);
    }

    $scope.$on("DimRedPlot::resize", function (e, numOfPlots) {
      /*jslint unparam:true*/
      dimredplot.automaticResize(numOfPlots === 1);
      dimredplot.invertPlotOrder(numOfPlots === 2 && $scope.analysis.plotIdx === 0);

      resize();
      changeSelection();
    });

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    $scope.$on("DimRedPlot::selectionUpdated", function (ev, method) {
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

    function setColor() {
      /*jslint todo:true*/
      var variable = Color.colorVariable(),
        schema;

      if (variable !== undefined) {
        schema = _.find(DataSet.schema(), "name", variable);
      }

      // TODO: Currently there is no support for colour mapping categorical variables,
      // so for now we will just ignore these. In the future we may just want to upgrade
      // the colourmap chart or not show a colour map, just colour the points.
      if (schema === undefined) {
        return;
      }

      DataSet.get([variable], function (rows) {
        var variableValues = {};

        _.each(rows, function (row) {
          variableValues[row.row] = row[variable];
        });

        dimredplot
          .colorFunction(Color.colorFn())
          .colorVariableName(variable)
          .colorVariableValues(variableValues);
      });
    }

    function updatePlot() {
      $scope.analysis.flags = {pointsChanged: true};

      function calculateContribution(axesIdx) {

        if ($scope.analysis.individualProjections === undefined) {
          return;
        }

        var xyContributions = {},
          xVariance = $scope.analysis.explainedVariance[axesIdx[0]],
          yVariance = $scope.analysis.explainedVariance[axesIdx[1]];

        _.forEach($scope.analysis.individualProjections, function (projection) {
          xyContributions[projection.id] = (projection.contrib[axesIdx[0]] * xVariance +
                                            projection.contrib[axesIdx[1]] * yVariance) /
                                            (xVariance + yVariance);
        });

        DataSet.addVariable($scope.analysis.method[0].toUpperCase() + " x+y contribution", xyContributions, "numeric", "Analytics");
      }

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
        .on("changeAxes", function (drp, axesIdx) {
          /*jslint unparam:true*/
          calculateContribution(axesIdx);
        })
        .individualSelections(DimRedPlot.selections.individual)
        .variableSelections(DimRedPlot.selections.variable)
        .individualInfluences(DimRedPlot.influences.individual)
        .variableInfluences(DimRedPlot.influences.variable);

      resize();
      calculateContribution([0, 1]);
      setColor();
      changeSelection();
    }



    $scope.$on("Colors::changed", function () {
      setColor();

      changeSelection();
    });

    updatePlot();
  });
