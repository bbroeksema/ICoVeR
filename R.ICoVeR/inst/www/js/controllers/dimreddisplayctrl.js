/*jslint indent: 2, todo:true, nomen:true */
/*global angular, d3, _ */

angular.module('contigBinningApp.controllers')
  .controller('DimRedDisplayCtrl', function ($scope, $rootScope) {

    'use strict';

    $scope.clusters = [];
    $scope.cluster = undefined;

    function updateState(dimRedData) {
      // NOTE: The backend calculates up to 12 clustering levels (at most).
      var maxClusterCount = Math.min(dimRedData.projections.length, 13);
      $scope.clusters = _.map(_.range(2, maxClusterCount),
        function (val) {
          return { count: val, label: String(val) };
        });

      $scope.clusters.unshift({ count: 0, label: "No clustering" });
      $scope.cluster = $scope.clusters[0];
    }

    /*jslint unparam: true */
    $scope.$on("Analytics::dimensionalityReduced", function (ev, method, session) {
      session.getObject(updateState);
    });
    /*jslint unparam: false */

    $scope.$watch('cluster', function (newCount) {
      if (newCount !== undefined) {
        $rootScope.$broadcast("DimRedDisplay::cluster", newCount.count);
      }
    });
  });
