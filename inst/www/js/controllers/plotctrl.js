/*jslint indent: 2, nomen: true */
/*global angular, _, d3 */

angular.module('contigBinningApp.controllers')
  .controller('PlotCtrl', function ($scope, DimRedPlot) {

    'use strict';

    $scope.analyses = [];

    $scope.dimredplotWidth = "col-lg-12";

    $scope.hideOptions = false;

    $scope.sliding = {"left": 0};

    function switchOptions() {
      if ($scope.hideOptions) {
        $scope.sliding = {"left": 0};
        $scope.hideOptions = false;
      } else {
        $scope.sliding = {"left": "-40%"};
        $scope.hideOptions = true;
      }
    }

    $scope.switchOptions = function () {
      switchOptions();
    };

    // Makes sure that the labels of points are no longer than 80px
    function createWrappedLabels(points) {
      var testText = d3.select("body").append("div").style("float", "left");

      testText.style("font-size", "8px");

      function wrap(d, i) {
        /*jslint unparam:true*/
        var textLength,
          string,
          desiredStringLength,
          label = d.id;

        if (d.label !== undefined) {
          label = d.label;
        }

        testText.text(label);
        textLength = testText.node().offsetWidth;

        string = label;
        desiredStringLength = Math.ceil(80 / textLength * string.length);

        string = string.slice(0, desiredStringLength);
        testText.text(string);
        textLength = testText.node().clientWidth;

        while (textLength > 80 && string.length > 0) {
          string = string.slice(0, -1);
          testText.text(string);
          textLength = testText.node().clientWidth;
        }

        d.wrappedLabel = string;
      }

      points.forEach(wrap);

      testText.remove();
    }

    function updatePlot(data) {
      $scope.$apply(function () {
        var analysis = data.analyses[0],
          index;

        DimRedPlot.addProcessedData(data.processedData);

        if (analysis.variableProjections !== undefined) {
          createWrappedLabels(analysis.variableProjections);
        }
        if (analysis.individualProjections !== undefined) {
          if (analysis.individualProjections.length > 1000) {
            analysis.individualProjections = undefined;
          } else {
            createWrappedLabels(analysis.individualProjections);
          }
        }

        index = _.findIndex($scope.analyses, {'method': analysis.method});

        if (index === -1) {
          $scope.analyses.push(analysis);
        } else {
          $scope.analyses[index] = analysis;
        }

        $scope.dimredplotWidth = "col-lg-" + (12 / $scope.analyses.length);

        if ($scope.analyses.length > 1) {
          if (!$scope.hideOptions) {
            switchOptions();
          }
        }
      });

      $scope.$broadcast("DimRedPlot::resize");
    }

    $scope.$on("Analytics::dimensionalityReduced", function (ev, method, session) {
      /*jslint unparam: true */
      session.getObject(updatePlot);
    });
  });
