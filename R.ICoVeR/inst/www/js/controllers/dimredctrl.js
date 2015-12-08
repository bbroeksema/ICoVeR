/*jslint indent: 2, nomen: true */
/*global angular, _, list */

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
  .controller('DimRedCtrl', function ($scope, $modal, R, DimRedPlot, DataSet) {

    'use strict';

    var d = {
      schema: undefined
    };

    function createGroupTypeRestrictionTest(restriction) {
      var groupType = restriction,
        test = function (gt) { return gt === groupType; };

      if (restriction[0] === '!') {
        groupType = restriction.substr(1);
        test = function (gt) { return gt !== groupType; };
      }

      return function (variable) {
        return test(variable.group_type);
      };
    }

    function createTypeRestrictionTest(restriction) {
      if (restriction === 'schema.numeric') {
        return function (variable) {
          return R.is.numeric(variable.type);
        };
      }
      if (restriction === 'schema.factor') {
        return function (variable) {
          return R.is.factor(variable.type);
        };
      }

      throw ('Unsupported type restriction');
    }

    function updateSelectedVariables(variables) {
      if (variables.length === 0) {
        $scope.selectionText = "Select variables...";
        $scope.selectionTextLong = "No variables selected";
      } else {
        var text = _.reduce(variables, function (str, variable) {
          return str === "" ? variable.name : str + ", " + variable.name;
        }, "");
        if (text.length > "Select variables...".length) {
          $scope.selectionTextLong = text;
          text = "Selected " + variables.length + " variables";
        }
        $scope.selectionText = text;
        $scope.selectedVariables = variables;
      }
      $scope.configurationInvalid = $scope.selectedVariables.length === 0;
    }

    function setVariables() {
      if ($scope.selectedDimRedMethod === undefined || d.schema === undefined) {
        $scope.variables = [];
      } else {
        // FIXME: This is a sloppy implementation as I didn't think this out
        //        very well. Actually, it should allow for multiple types for
        //        group restriction.
        var restrictions = $scope.selectedDimRedMethod.restrict,
          matchesGroupRestriction = createGroupTypeRestrictionTest(restrictions.group_type),
          matchesTypeRestriction = createTypeRestrictionTest(restrictions.type);

        $scope.variables = _.filter(d.schema, matchesGroupRestriction);
        $scope.variables = _.filter($scope.variables, matchesTypeRestriction);
        $scope.variables = _.filter($scope.variables, function (variable) {
          return variable.analysable;
        });
      }
    }

    $scope.selectionText = "Select variables...";
    $scope.selectionTextLong = "No variables selected";
    $scope.variables = [];
    $scope.dimRedMethods = [];

    $scope.configurationInvalid = true;
    $scope.selectedDimRedMethod = $scope.dimRedMethods[0];
    $scope.selectedVariables = [];

    $scope.changeDimRedMethod = function (newMethod) {
      // Somehow, if I do not do this, selectedDimRedMethod won't be updated until after the function has finished
      $scope.selectedDimRedMethod = newMethod;

      if (newMethod === undefined) { return; }
      setVariables();
      $scope.selectedVariables = [];
      updateSelectedVariables([]);
    };

    $scope.$on('DimRedPlot::variablesSelected', function (e, dimRedMethod) {
      /*jslint unparam: true*/
      $scope.dimRedMethods.some(function (method) {
        if (method.name === dimRedMethod) {
          $scope.selectedDimRedMethod = method;
          return true;
        }
        return false;
      });

      setVariables();

      var variables = [],
        selectedVariables = DimRedPlot.selectedVariables();

      _.forEach(selectedVariables, function (variable) {

        $scope.variables.some(function (schemaVariable) {
          if (schemaVariable.name === variable) {
            variables.push(schemaVariable);
            return true;
          }
          return false;
        });
      });

      updateSelectedVariables(variables);
    });

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      $scope.dataAvailable = true;
      d.schema = schema;
      setVariables();
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DimRedPlot::dimRedMethodsAvailable', function (e, methods) {
      // ICoVeR: For now we only suppor CA on (T|P)NF, so we filter out all
      //          other dim. red. methods.
      $scope.dimRedMethods = _.filter(methods, function (m) { return m.name === "ca" || m.name === "pca"; });
      $scope.selectedDimRedMethod = $scope.dimRedMethods[0];
      setVariables();
    });
    /*jslint unparam: false */

    $scope.$on('DimRedPlot::dimensionalityReduced', function () {
      $scope.configurationInvalid =
        $scope.selectedVariables.length === 0
        || $scope.selectedDimRedMethod === undefined;
    });

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

    $scope.reduceDimensionality = function () {
      var drMethod = $scope.selectedDimRedMethod.name,
        vars = _.pluck($scope.selectedVariables, 'name');

      // For quick loading purposes we are making sure here that all variables requested are loaded
      DataSet.get(vars, function () { return; });

      $scope.configurationInvalid = true;
      DimRedPlot.reduce(drMethod, vars);
    };
  });
