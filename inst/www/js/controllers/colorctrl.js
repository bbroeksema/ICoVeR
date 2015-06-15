/*jslint indent: 2, nomen: true */
/*global angular, _*/

angular.module('contigBinningApp.controllers')
  .controller('ColorCtrl', function ($scope, R, Color) {

    'use strict';

    var d = {
      methods: undefined,
      initialSchemaLoad: true
    };

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

    function onVariableChange() {
      if ($scope.colorVariable && R.is.numeric($scope.colorVariable.type)) {
        d.methods = Color.configuration().numeric;
      } else if ($scope.colorVariable && R.is.factor($scope.colorVariable.type)) {
        d.methods = Color.configuration().factor;
      } else {
        d.methods = undefined;
        $scope.colorMethod = undefined;
      }

      $scope.colorMethods = _.keys(d.methods);
      if ($scope.colorMethod === undefined
          || !_.contains($scope.colorMethods, $scope.colorMethod)) {
        $scope.colorMethod = $scope.colorMethods[0];
      } else {
        onMethodChange();
      }
    }

    function onOpacityChange() {
      Color.opacity($scope.opacity);
    }

    $scope.variables = [];
    $scope.colorMethods = [];
    $scope.colorSchemes = [];
    $scope.colorVariable = undefined;
    $scope.colorMethod = undefined;
    $scope.colorScheme = undefined;
    $scope.opacity = 0.05;

    $scope.applyColoring = function () {
      Color.color($scope.colorVariable.name, $scope.colorMethod, $scope.colorScheme);
    };

    function updateVariables(schema) {
      $scope.dataAvailable = true;
      $scope.variables = _.filter(schema, function (variable) {
        return R.is.numeric(variable.type) || R.is.factor(variable.type);
      });

      // Make sure that the manual selection option is on top
      var manualIndex = _.findIndex($scope.variables, "name", "Manual selection"),
        manualSelectionVar,
        colorVariable;

      if (manualIndex !== -1) {
        manualSelectionVar = $scope.variables[manualIndex];
        $scope.variables.splice(manualIndex, 1);
        $scope.variables.splice(0, 0, manualSelectionVar);
      }

      if ($scope.colorVariable !== undefined) {
        colorVariable = _.find($scope.variables, "name", $scope.colorVariable.name);
        $scope.colorVariable = colorVariable;
      }
    }

    $scope.$on('Colors::changed', function () {
      $scope.colorVariable = _.find($scope.variables, "name", Color.colorVariable());
      $scope.colorMethod = Color.colorMethod();
      $scope.colorScheme = Color.colorSchemeName();
    });

    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      /*jslint unparam: true */
      updateVariables(schema);

      if (d.initialSchemaLoad) {
        // We only want to change the color scheme implicitly the first time we
        // recieve data. Afterwards it's up to the user to change the color
        // scheme to his or her likening.
        d.initialSchemaLoad = false;

        $scope.colorVariable = _.find(schema, { 'name': 'GC_CONTENT' });
        $scope.colorMethod = "Decile";
        $scope.colorScheme = "yellow_to_red";
        $scope.applyColoring();

        $scope.$watch('colorVariable', onVariableChange);
        $scope.$watch('colorMethod', onMethodChange);
        $scope.$watch('opacity', onOpacityChange);
      }
    });
  });
