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
  .controller('ClusterConfigCtrl', function ($scope, $modalInstance, options, DataSet) {

    'use strict';

    // It is possible that there are less than 30 individuals, in which case we can not use 30 clusters.
    // The default number of clusters in this case is less than the number of rows as it would otherwise,
    // make no sense.
    var previousCentersCount = Math.min(30, Math.floor(Math.sqrt(DataSet.data().length)));

    function updateControllerState() {
      $scope.specified.identifier = $scope.specified.method.name
        + ($scope.specified.centers !== -1 ? '_' + $scope.specified.centers : "")
        + '_' + ($scope.specified.variables.length || 0);

      $scope.configurationInvalid =
        ($scope.specified.centers < 2 && $scope.specified.centers !== -1)
        || $scope.specified.variables.length < 1;
    }

    $scope.options = options;
    $scope.configurationInvalid = true;

    $scope.specified = {
      method: $scope.options.methods[0],
      identifier: $scope.options.methods[0].name + '_' + previousCentersCount + '_0',
      centers: previousCentersCount, // NOTE: The naming is kmeans specific
      variables: []
    };

    $scope.$watch('specified.centers', updateControllerState);
    $scope.$watch('specified.variables', updateControllerState);
    $scope.$watch('specified.method', updateControllerState);

    $scope.ok = function () {
      $modalInstance.close($scope.specified);
    };

    $scope.hideCenters = function () {
      if ($scope.specified.method.name !== "kmeans") {
        previousCentersCount = $scope.specified.centers;
        $scope.specified.centers = -1;
        return true;
      }
      if ($scope.specified.centers === -1) {
        $scope.specified.centers = previousCentersCount;
      }
      return false;
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };
  });
