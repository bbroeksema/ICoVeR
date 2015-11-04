/*jslint indent: 2, todo:true, nomen:true */
/*global angular, d3, _ */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
