'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ClusterCtrl', function ($scope, DataSet) {

    $scope.configurationInvalid = true;

    $scope.$on('DataSet::loaded', function() { $scope.dataAvailable = true });
  });
