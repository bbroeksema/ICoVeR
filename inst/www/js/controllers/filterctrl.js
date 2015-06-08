'use strict';

angular.module('contigBinningApp.controllers')
  .controller('FilterCtrl', function ($scope, $rootScope, DataSet) {

    $scope.itemsBrushed = false;
    $scope.dataFiltered = false;
    $scope.filteringInProgress = false;

    $scope.keepSelected = function() {
      $scope.filteringInProgress = true;
      DataSet.filter(DataSet.FilterMethod.KEEP);
    };

    $scope.removeSelected = function() {
      $scope.filteringInProgress = true;
      DataSet.filter(DataSet.FilterMethod.REMOVE);
    };

    $scope.reloadData = function() {
      DataSet.filter(DataSet.FilterMethod.RESET);
    }

    $scope.$on('DataSet::loaded', function() { $scope.dataFiltered = false });
    $scope.$on('DataSet::filtered', function(e, method) {
      $scope.filteringInProgress = false;
      $scope.dataFiltered = method !== DataSet.FilterMethod.RESET;
    });
    $scope.$on('DataSet::brushed', function(e, extents) {
      $scope.itemsBrushed = Object.getOwnPropertyNames(extents).length > 0;
    });
  });
