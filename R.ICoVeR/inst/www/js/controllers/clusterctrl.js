/*jslint indent: 2, nomen: true */
/*global angular, _ */

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
  .controller('ClusterCtrl', function ($scope, $modal, Analytics, R) {

    'use strict';

    var d = {
      schema: undefined
    };

    function setVariables() {
      $scope.options.variables = _.filter(d.schema, function (variable) {
        return R.is.numeric(variable.type) && variable.analysable;
      });
    }

    function performClustering(config) {
      var args = {};
      // FIXME: Generalize this code, we don't want to change this code for
      //        every clustering method we add.
      if (config.method.name === "kmeans") {
        args.centers = config.centers;
      } else if (config.method.name !== "correlation") {
        //FIXME get rid of this hard coded value, change it to a simple else
        throw "Unknown clustering method: " + config.method.name;
      }

      Analytics.cluster(
        config.method.name,
        _.map(config.variables,
              function (variable) { return variable.name; }),
        args,
        config.identifier
      );
    }

    // Available clustering options.
    $scope.options = {
      methods: [],
      variables: [],

      valid: function () {
        return $scope.options.methods.length > 0
          && $scope.options.variables.length > 2;
      }
    };

    $scope.canCluster = false;

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      d.schema = schema;
      setVariables();
      $scope.canCluster = $scope.options.valid();
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('Analytics::clusterMethodsAvailable', function (e, methods) {
      $scope.options.methods = methods;
      $scope.canCluster = $scope.options.valid();
    });
    /*jslint unparam: false */

    $scope.openSelectionDialog = function () {
      var dialog = $modal.open({
        templateUrl: 'js/templates/clusterconfig.html',
        size: 'md',
        controller: 'ClusterConfigCtrl',
        resolve: {
          options: function () {
            return $scope.options;
          }
        }
      });

      dialog.result.then(performClustering);
    };
  });
