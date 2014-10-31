/*jslint indent: 2 */
/*global angular */

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ClusterConfigCtrl', function ($scope, $modalInstance, options) {

    function updateControllerState() {
      $scope.specified.identifier = $scope.options.methods[0].name
        + '_' + $scope.specified.centers
        + '_' + ($scope.specified.variables.length || 0);

      $scope.configurationInvalid =
        $scope.specified.clusterCount < 2
        || $scope.specified.variables.length < 1;
    }

    $scope.options = options;
    $scope.configurationInvalid = true;

    $scope.specified = {
      method: $scope.options.methods[0],
      identifier: $scope.options.methods[0].name + '_30_0',
      centers: 30, // NOTE: The naming is kmeans specific
      variables: []
    };

    $scope.$watch('specified.centers', updateControllerState);
    $scope.$watch('specified.variables', updateControllerState);

    $scope.ok = function () {
      $modalInstance.close($scope.specified);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };
  });
