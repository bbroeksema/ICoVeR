/*jslint indent: 2 */
/*global angular */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
    $scope.$on("DataSet::filtered", function (ev, rows) {
      currentRowCount = rows.length;
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
