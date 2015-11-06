/*jslint indent: 2, nomen: true */
/*global angular, _*/

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.

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
      if ($scope.colorVariable !== undefined) {
        Color.color($scope.colorVariable.name, $scope.colorMethod, $scope.colorScheme);
      }
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
