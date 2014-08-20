'use strict';

angular.module('contigBinningApp.controllers')
  .controller('FilterCtrl', function ($scope, $rootScope, DataSet) {

    function updateBrushed(e, extents) {
      $scope.itemsBrushed = Object.getOwnPropertyNames(extents).length > 0;
    };

    $scope.itemsBrushed = false;

    $scope.keepSelected = function() {
      DataSet.filter(DataSet.FilterMethod.KEEP);
    };

    $scope.removeSelected = function() {
      DataSet.filter(DataSet.FilterMethod.REMOVE);
    };

    $scope.$on('DataSet::brushed', updateBrushed);
    $scope.$on('DataSet::filtered', updateBrushed);
  });
