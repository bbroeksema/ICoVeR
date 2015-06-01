/*jslint indent: 2, nomen: true */
/*global angular, _*/

angular.module('contigBinningApp.controllers')
  .controller('ManualColoringCtrl', function ($scope, Color) {

    'use strict';

    $scope.colors = [];
    $scope.manualColoringEnabled = false;

    $scope.itemsBrushed = false;

    $scope.$on("Colors::changed", function (e, rowColors, colorFunction, colorCriterion) {
      /*jslint unparam:true*/
      if (colorCriterion === "Manual selection") {
        if (!$scope.manualColoringEnabled || $scope.colors !== Color.colorScheme()) { // Manual selection is already on
          $scope.manualColoringEnabled = true;
          $scope.colors = Color.colorScheme();
        }
      } else {
        $scope.manualColoringEnabled = false;
      }
    });

    $scope.colorSelection = function (color) {
      Color.colorBrushed(color);
    };

    $scope.$on("DataSet::brushed", function (e, rows) {
      /*jslint unparam:true*/
      $scope.itemsBrushed = rows.length > 0;
    });
  });
