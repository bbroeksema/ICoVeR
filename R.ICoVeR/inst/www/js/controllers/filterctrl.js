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
  .controller('FilterCtrl', function ($scope, DataSet) {

    'use strict';

    $scope.itemsBrushed = false;
    $scope.dataFiltered = false;
    $scope.filteringInProgress = false;

    $scope.keepSelected = function () {
      $scope.filteringInProgress = true;
      DataSet.filter(DataSet.FilterMethod.KEEP);
    };

    $scope.removeSelected = function () {
      $scope.filteringInProgress = true;
      DataSet.filter(DataSet.FilterMethod.REMOVE);
    };

    $scope.reloadData = function () {
      DataSet.filter(DataSet.FilterMethod.RESET);
    };

    $scope.$on('DataSet::loaded', function () { $scope.dataFiltered = false; });

    $scope.$on('DataSet::filtered', function () {
      $scope.filteringInProgress = false;
      $scope.dataFiltered = DataSet.filtered();
    });

    /*jslint unparam: true */
    $scope.$on('DataSet::brushed', function (e, rows) {
      $scope.itemsBrushed = rows.length > 0;
    });
    /*jslint unparam: false */
  });
