/*jslint indent: 2 */
/*global angular */

angular.module('contigBinningApp.controllers')
  .controller('VariableSelectionCtrl', function ($scope, $modalInstance, variables, selected) {

    'use strict';

    $scope.variables = variables;
    // https://stackoverflow.com
    //   /questions/21379173/angularjs-ui-modal-and-select-doesnt-update-the-scope-values
    $scope.selected = {
      variables: selected
    };

    $scope.ok = function () {
      $modalInstance.close($scope.selected.variables);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };
  });
