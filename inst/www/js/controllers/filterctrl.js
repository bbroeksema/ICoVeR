'use strict';

angular.module('contigBinningApp.controllers')
  .controller('FilterCtrl', function ($scope, $rootScope, DataSet) {
    $scope.brushed = [];
    $scope.$on('Data::brushed', function() {
      $scope.brushed = DataSet.brushed;
      $scope.$apply();
    });
  });
