/*jslint indent: 2, nomen: true */
/*global angular, _ */

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ClusterCtrl', function ($scope, $http, $modal, DataSet, Analytics, R) {
    var d = {
      schema: undefined
    };

    function setVariables() {
      if ($scope.selectedClusterMethod === undefined || d.schema === undefined) {
        $scope.variables = [];
      } else {
        $scope.variables = _.filter(d.schema, function (variable) {
          return R.is.numeric(variable.type);
        });
        $scope.selectedVariables = [];
      }
    }

    function updateSelectedVariables(variables) {
      var text = _.reduce(variables, function (str, variable) {
        return str === "" ? variable.name : str + ", " + variable.name;
      }, "");
      if (text.length > "Select variables...".length) {
        $scope.selectionTextLong = text;
        text = "Selected " + variables.length + " variables";
      }
      $scope.selectionText = text;
      $scope.selectedVariables = variables;
      $scope.configurationInvalid = $scope.selectedVariables.length === 0;
    }

    $scope.selectionText = "Select variables...";
    $scope.selectionTextLong = "No variables selected";
    $scope.variables = [];
    $scope.clusterMethods = [];

    $scope.configurationInvalid = true;
    $scope.selectedClusterMethod = $scope.clusterMethods[0];
    $scope.selectedVariables = [];

    /*jslint unparam: true */
    $scope.$watch('selectedClusterMethod', function (newMethod, oldMethod) {
      if (newMethod === undefined) { return; }
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      $scope.dataAvailable = true;
      d.schema = schema;
      setVariables();
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('Analytics::clusterMethodsAvailable', function (e, methods) {
      $scope.clusterMethods = methods;
      $scope.selectedClusterMethod = $scope.clusterMethods[0];
      setVariables();
    });
    /*jslint unparam: false */

    $scope.openSelectionDialog = function () {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function () {
            return $scope.variables;
          },
          selected: function () {
            return $scope.selectedVariables;
          }
        }
      });

      dialog.result.then(updateSelectedVariables);
    };

    $scope.cluster = function () {
      Analytics.cluster(
        $scope.selectedClusterMethod.name,
        _.map($scope.selectedVariables,
              function (variable) { return variable.name; }),
        null
      );
    };
  });
