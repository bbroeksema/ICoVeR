'use strict';

angular.module('contigBinningApp.controllers')
  .controller('FilterCtrl', function ($scope, $rootScope, DataSet) {

    function updateBrushed(e, extents) {
      $scope.itemsBrushed = Object.getOwnPropertyNames(extents).length > 0;
    };

    $scope.itemsBrushed = false;
    $scope.$on('DataSet::brushed', updateBrushed);
  });
