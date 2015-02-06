/*jslint indent: 2 */
/*global angular */

angular.module('contigBinningApp.controllers')
  .controller('DataIndicatorCtrl', function ($scope) {

    'use strict';

    var overallRowCount = 0, // The total number of rows in the dataset
      currentRowCount = 0,   // The current number of rows in the views
      brushedRowCount = 0;   // The current number of rows which are brushed

    $scope.rowCount = 0;
    $scope.counts = [];

    /*jslint unparam: true */
    $scope.$on("DataSet::brushed", function (ev, rows) {
      brushedRowCount = rows.length;

      if (rows.length > 0) {
        $scope.counts = [
          { rows: brushedRowCount, type: "brushed" },
          { rows: currentRowCount - brushedRowCount, type: "" }
        ];
      } else {
        $scope.counts = [{ rows: currentRowCount, type: "" }];
      }
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on("DataSet::filtered", function (ev, method) {
      switch (method) {
      case "KEEP":
        currentRowCount = brushedRowCount;
        break;
      case "REMOVE":
        currentRowCount = currentRowCount - brushedRowCount;
        break;
      case "RESET":
        currentRowCount = overallRowCount;
        break;
      }

      brushedRowCount = 0;
      if ($scope.rowCount === overallRowCount) {
        $scope.counts = [{ rows: currentRowCount, type: "" }];
      } else {
        $scope.rowCount = currentRowCount;
        $scope.counts = [{ rows: currentRowCount, type: "" }];
      }
    });
    /*jslint unparam: false */

    $scope.changeScale = function () {
      if ($scope.rowCount === overallRowCount) {
        $scope.rowCount = currentRowCount;
      } else {
        $scope.rowCount = overallRowCount;
      }
    };

    /*jslint unparam: true */
    $scope.$on("App::configurationLoaded", function (ev, cfg) {
      overallRowCount = currentRowCount = cfg.data.dimensions.rows;
      brushedRowCount = 0;

      $scope.rowCount = currentRowCount;
      $scope.counts = [{ rows: currentRowCount, type: "" }];
    });
    /*jslint unparam: false */
  });
