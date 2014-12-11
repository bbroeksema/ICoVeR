/*jslint indent: 2 */
/*global angular */

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('FilterCtrl', function ($scope, DataSet) {

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

    /*jslint unparam: true */
    $scope.$on('DataSet::filtered', function (e, method) {
      $scope.filteringInProgress = false;
      $scope.dataFiltered = method !== DataSet.FilterMethod.RESET;
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DataSet::brushed', function (e, extents) {
      var nExtents = Object.getOwnPropertyNames(extents.extents).length,
        categories = Object.getOwnPropertyNames(extents.categories).length;

      $scope.itemsBrushed = (nExtents + categories) > 0;
    });
    /*jslint unparam: false */
  });
