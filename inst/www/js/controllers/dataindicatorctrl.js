/*jslint indent: 2 */
/*global angular */

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('DataIndicatorCtrl', function ($scope, DataSet) {

    $scope.rowCount = 0;
    $scope.currentRowCount = 0;
    $scope.counts = [];

    /*jslint unparam: true */
    $scope.$on("DataSet::brushed", function (ev, extents, rows) {
      if (Object.getOwnPropertyNames(extents).length > 0) {
        $scope.counts = [
          { rows: rows.length, type: "brushed" },
          { rows: $scope.currentRowCount - rows.length, type: "" }
        ];
      } else {
        $scope.counts = [{ rows: $scope.currentRowCount, type: "" }];
      }
    });
    /*jslint unparam: false */

    // setting the call back  for the total row count
    DataSet.getTotalNumRows(function (rowCount) {
      $scope.rowCount  = rowCount;
    });

    // setting the call back  for the current row count
    DataSet.setCurrentNumRowsCallback(function (currentRowCount) {
      $scope.currentRowCount = currentRowCount;
      $scope.counts = [{ rows: $scope.currentRowCount, type: "" }];
    });
  });
