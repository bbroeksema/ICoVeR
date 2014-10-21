/*jslint indent: 2, nomen: true */
/*global angular, _*/

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ColorCtrl', function ($scope, R, Color) {

    var d = {
      config: {},
      methods: undefined,
    };

    function onVariableChange() {
      if ($scope.colorVariable && R.is.numeric($scope.colorVariable.type)) {
        d.methods = d.config.numeric;
      } else {
        d.methods = undefined;
        $scope.colorMethod = undefined;
      }

      $scope.colorMethods = _.keys(d.methods);
      if ($scope.colorMethod === undefined
          || !_.contains($scope.colorMethods, $scope.colorMethod)) {
        $scope.colorMethod = $scope.colorMethods[0];
      }
    }

    function onMethodChange() {
      if (d.methods === undefined) {
        $scope.colorSchemes = [];
        $scope.colorScheme = undefined;
        return;
      }

      $scope.colorSchemes = d.methods[$scope.colorMethod];
      if ($scope.colorSchemes === undefined) {
        $scope.colorSchemes = [];
      } else if (!_.isArray($scope.colorSchemes)) {
        $scope.colorSchemes = [$scope.colorSchemes];
      }

      if ($scope.colorScheme === undefined
          || !_.contains($scope.colorSchemes, $scope.colorScheme)) {
        $scope.colorScheme = $scope.colorSchemes[0];
      }
    }

    $scope.variables = [];
    $scope.colorMethods = [];
    $scope.colorSchemes = [];
    $scope.colorVariable = undefined;
    $scope.colorMethod = undefined;
    $scope.colorScheme = undefined;

    $scope.applyColoring = function () {
      Color.color($scope.colorVariable.name, $scope.colorMethod, $scope.colorScheme);
    };

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      $scope.dataAvailable = true;
      $scope.variables = _.filter(schema, function (variable) {
        return R.is.numeric(variable.type);
      });
      $scope.colorVariable = undefined;
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on("Colors::configurationLoaded", function (e, config) {
      d.config = config;
    });
    /*jslint unparam: false */

    $scope.$watch('colorVariable', onVariableChange);
    $scope.$watch('colorMethod', onMethodChange);
  });
