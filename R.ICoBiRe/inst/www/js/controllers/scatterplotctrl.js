/*jslint indent: 2, nomen: true */
/*global angular, document, d3, ScatterPlot, _, $ */

angular.module('contigBinningApp.controllers')
  .controller('ScatterplotCtrl', function ($scope, $modal, $window, $element) {

    'use strict';

    var loadFromFile_DEBUG = true,
      sp = new ScatterPlot("#scatterplotDiv"),
      sWidth = $element[0].clientWidth,
      sHeight = $element[0].clientHeight;

    $scope.squareScatterplotSides = false;  // if through both hiehgt and width shiuld be the same

    $scope.dimensionalityReductionTypes = ["Correspondance Analysis", "Princple Component Analysis"];
    $scope.dimensionalityReductionType = $scope.dimensionalityReductionTypes[0];

    $scope.scatterDataTypes = ["row", "column", "All"];
    $scope.sourceData = ["row", "column", "All"];
    $scope.scatterPlotDataType = "All";
    $scope.selectedVariables = [];
    $scope.variables = [];
    $scope.selectionText = "Select variables...";

    function updateSelectedVariables(variables) {
      var text = _.reduce(variables, function (str, variable) {
        return str === "" ? variable.name : str + ", " + variable.name;
      }, "");
      if (text.length > "Select variables...".length) {
        $scope.selectionTextLong = text;
        text = "Selected " + variables.length + " variables";
      }
      $scope.selectionText = text;
      $scope.selectedVariables = variables;
      $scope.configurationInvalid = $scope.selectedVariables.length === 0;
    }

    function resize() {
      var sp_data = sp.data();
      if (sp_data) {
        sWidth = $element[0].clientWidth;
        sHeight = $element[0].clientHeight;
        sp.width(sWidth).height(sHeight);
        sp.draw();
      }
    }

    /*jslint unparam: true */
    $scope.$on("DataSet::ScatterDataLoaded", function (ev, data) {
      sp.data(data);
      sp.draw();
    });
    /*jslint unparam: false */

    function loadScatterPlotDataTest(filename) {
      // this function is used to associate ui interactions with the data
      // the LoadScatterPlotData loads the data without attaching items from this test UI
      d3.json(filename, function (error, data) {
        if (!error) {
          if (data.hasOwnProperty("dataItems")) {
            sp.data(data);
            resize();
          } else {
            console.log(" Invalid file data : no Data ITems Property    filename = " + filename);
          }
        } else {
          console.log(" error loading file: " + error + "    filename = " + filename);
        }
      });
    }
    $scope.executeDimensionalityReduction = function () {
      if (loadFromFile_DEBUG) {
        sWidth = $element[0].clientWidth;
        sHeight = $element[0].clientHeight;
        console.log("sWidth = " + sWidth + " sHeight = " + sHeight);
        sp.width(sWidth).height(sHeight);
        loadScatterPlotDataTest("./calibrate.json");
      }
    };

    function toggleSquareSides() {
      if (sp.data()) {
        //$scope.squareScatterplotSides != $scope.squareScatterplotSides;
        if ($scope.squareScatterplotSides) {
          var smallestSide = d3.min([sp.width(), sp.height()]);
          sp.width(smallestSide).height(smallestSide);
          sp.draw();
        } else {
          sp.width(sWidth).height(sHeight);
          sp.draw();
        }
      }
    }

    function onDataTypeChange() {
      console.log("Scatter Plot Data Type Changed");
    }

    $scope.openSelectionDialog = function () {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function () {
            return $scope.variables;
          },
          selected: function () {
            return $scope.selectedVariables;
          }
        }
      });

      dialog.result.then(updateSelectedVariables);
    };
    angular.element($window).bind('resize', resize);
    $(document).ready(resize);
    $scope.$watch('scatterPlotDataType', onDataTypeChange);
    $scope.$watch('squareScatterplotSides', toggleSquareSides);
  });
