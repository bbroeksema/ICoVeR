'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ColorCtrl', function ($scope, R, Color) {

    $scope.variables = [];
    $scope.colorMethods = [];
    $scope.colorVariable = undefined;
    $scope.colorMethod = undefined;

    $scope.$on('DataSet::schemaLoaded', function(e, schema) {
      $scope.dataAvailable = true;
      $scope.variables = _.filter(schema, function(variable) {
        return R.is.numeric(variable.type)
      });
      $scope.colorVariable = undefined;
    });

    $scope.$watch('colorVariable', function(newVariable) {
      if (newVariable === undefined) {
        $scope.colorMethods = [];
        $scope.colorMethod = undefined;
      } else {
        $scope.colorMethods = Color.methods(newVariable.type);
        $scope.colorMethod = $scope.colorMethods[0];
      }
    });

    $scope.$watch('colorMethod', function(newMethod) {
      if (newMethod === undefined) {
        return; // TODO: Make sure that color is reset to default.
      }

      Color.color($scope.colorVariable, newMethod);
    });

  });
