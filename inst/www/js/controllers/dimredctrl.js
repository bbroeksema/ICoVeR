'use strict';

angular.module('contigBinningApp.controllers')
  .controller('DimRedCtrl', function ($scope, $http, $modal, DataSet, Analytics, R) {
    var d = {
      schema: undefined
    };

    function createGroupTypeRestrictionTest(restriction) {
      var groupType = restriction,
          test = function(gt) { return gt === groupType; };

      if (restriction[0] === '!') {
        groupType = restriction.substr(1),
        test = function(gt) { return gt !== groupType; };
      }

      return function(variable) {
        return test(variable['group.type'])
      }
    }

    function createTypeRestrictionTest(restriction) {
      if (restriction === 'schema.numeric') {
        return function(variable) {
          return R.is.numeric(variable['type']);
        }
      }

      throw('Unsupported type restriction');
    }

    function setVariables() {
      if ($scope.selectedDimRedMethod === undefined || d.schema === undefined) {
        $scope.variables = [];
      } else {
        // FIXME: This is a sloppy implementation as I didn't think this out
        //        very well. Actually, it should allow for multiple types for
        //        group restriction.
        var restrictions = $scope.selectedDimRedMethod['restrict'];
        var matchesGroupRestriction = createGroupTypeRestrictionTest(restrictions["group.type"]);
        var matchesTypeRestriction = createTypeRestrictionTest(restrictions["type"]);
        $scope.variables = _.filter(d.schema, matchesGroupRestriction);
        $scope.variables = _.filter($scope.variables, matchesTypeRestriction)
        $scope.selectedVariables = [];
        updateSelectedVariables([]);
      }
    };

    function updateSelectedVariables(variables) {
      if (variables.length === 0) {
        $scope.selectionText = "Select variables...";
        $scope.selectionTextLong = "No variables selected";
      } else {
        var text = _.reduce(variables, function(str, variable) {
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

    $scope.selectionText = "Select variables...";
    $scope.selectionTextLong = "No variables selected";
    $scope.variables = [];
    $scope.dimRedMethods = [];

    $scope.configurationInvalid = true;
    $scope.selectedDimRedMethod = $scope.dimRedMethods[0];
    $scope.selectedVariables = [];

    $scope.$watch('selectedDimRedMethod', function(newMethod, oldMethod) {
      if (newMethod === undefined) return;
      setVariables();
    });

    $scope.$on('DataSet::schemaLoaded', function(e, schema) {
      $scope.dataAvailable = true
      d.schema = schema;
      setVariables();
    });

    $scope.$on('Analytics::dimRedMethodsAvailable', function(e, methods) {
      $scope.dimRedMethods = methods;
      $scope.selectedDimRedMethod = $scope.dimRedMethods[0];
      setVariables();
    });

    $scope.openSelectionDialog = function() {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function() {
            return $scope.variables;
          },
          selected: function() {
            return $scope.selectedVariables;
          }
        }
      });

      dialog.result.then(updateSelectedVariables);
    };

    $scope.reduceDimensionality = function() {
      var drMethod = $scope.selectedDimRedMethod.name,
          vars = _.pluck($scope.selectedVariables, 'name');

      Analytics.reduce(drMethod, vars);
    }
  });
