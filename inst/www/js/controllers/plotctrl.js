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
        $scope.sliding = {"transform": "translate(0,0)"};
        $scope.hideOptions = false;
      } else {
        $scope.sliding = {"transform": "translate(-90%, 0)"};
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
        var index;

        DimRedPlot.addProcessedData(data.method[0], data.processedData);

        if (data.variableProjections !== undefined) {
          createWrappedLabels(data.variableProjections);
        }
        if (data.individualProjections !== undefined) {
          createWrappedLabels(data.individualProjections);
        }

        index = _.findIndex($scope.analyses, {'method': data.method});

        if (index === -1) {
          $scope.analyses.push(data);
        } else {
          $scope.analyses[index] = data;
        }

        $scope.dimredplotWidth = "col-lg-" + (12 / $scope.analyses.length);

        if ($scope.analyses.length > 1) {
          if (!$scope.hideOptions) {
            switchOptions();
          }
        }
      });

      $scope.$broadcast("DimRedPlot::resize", $scope.analyses.length);
    }

    $scope.$on("Analytics::dimensionalityReduced", function (ev, method, session) {
      /*jslint unparam: true */
      session.getObject(updatePlot);
    });
  });
