'use strict';

angular.module('contigBinningApp.controllers')
  .controller('FilterCtrl', function ($scope, $rootScope, DataSet) {

    $scope.itemsBrushed = false;
    $scope.dataFiltered = false;

    $scope.keepSelected = function() {
      DataSet.filter(DataSet.FilterMethod.KEEP);
    };

    $scope.removeSelected = function() {
      DataSet.filter(DataSet.FilterMethod.REMOVE);
    };

    $scope.reloadData = function() {
      DataSet.load();
    }

    $scope.$on('DataSet::loaded', function() { $scope.dataFiltered = false });
    $scope.$on('DataSet::filtered', function() { $scope.dataFiltered = true; });
    $scope.$on('DataSet::brushed', function(e, extents) {
      $scope.itemsBrushed = Object.getOwnPropertyNames(extents).length > 0;
    });
  });
