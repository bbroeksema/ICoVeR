/*jslint indent: 2 */
/*global angular */

angular.module('contigBinningApp.controllers')
  .controller('NameSelectionCtrl', function ($scope, $modalInstance, selectedName) {

    'use strict';

    // https://stackoverflow.com
    //   /questions/21379173/angularjs-ui-modal-and-select-doesnt-update-the-scope-values
    $scope.data = {
      selectedName: "",
      placeholderName: selectedName
    };

    $scope.ok = function () {
      if ($scope.data.selectedName === "") {
        $scope.data.selectedName = $scope.data.placeholderName;
      }
      $modalInstance.close($scope.data.selectedName);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };
  });
