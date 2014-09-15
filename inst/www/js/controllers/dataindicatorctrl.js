'use strict';

angular.module('contigBinningApp.controllers')
  .controller('DataIndicatorCtrl', function ($scope) {
      
      $scope.rowCount = 0;
      $scope.currentRowCount = 0;
      $scope.counts = [];
      
      $scope.$on("DataSet::dataLoaded", function(ev, data) {
        if ($scope.rowCount === 0) {
          $scope.rowCount = data.length;
        }
        $scope.currentRowCount = data.length;
        $scope.counts = [{ rows: $scope.currentRowCount, type: "" }];
      });
      
      $scope.$on("DataSet::brushed", function(ev, extents, rows) {
        if (rows) {
          $scope.counts = [
            { rows: rows.length, type: "brushed" },
            { rows: $scope.currentRowCount - rows.length, type: "" }
          ];
        } else {
          $scope.counts = [{ rows: $scope.currentRowCount, type: "" }];
        }
      });
  });