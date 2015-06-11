/*jslint indent: 2, nomen: true */
/*global angular, _ */

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
