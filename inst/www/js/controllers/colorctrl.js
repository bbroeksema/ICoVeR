'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ColorCtrl', function ($scope, R, Color) {

    var d = {
      config: {}
    };
    
    var lastConfig = "";

    function configureColorMethods() {
      var methods = {};
      if ($scope.colorVariable && R.is.numeric($scope.colorVariable.type)) {
        methods = d.config.numeric;
      }
      
      $scope.colorMethods = _.keys(methods);
      
      if ($scope.colorMethod === undefined 
          || !_.contains($scope.colorMethods, $scope.colorMethod)) {
        $scope.colorMethod = $scope.colorMethods[0];
      }
      
      var schemes = methods[$scope.colorMethod];
      if (schemes === undefined) {
        schemes = [];
      } else if (!_.isArray(schemes)) {
        schemes = [schemes];
      }
      
      $scope.colorSchemes = schemes;
      if ($scope.colorScheme === undefined
          || !_.contains(schemes, $scope.colorScheme)) {
        $scope.colorScheme = $scope.colorSchemes[0];
      }
      
      var config = "" + $scope.colorVariable + $scope.colorMethod + $scope.colorScheme;
      if ($scope.colorVariable && $scope.colorMethod && $scope.colorScheme
          && config != lastConfig) {
        lastConfig = config;
        Color.color($scope.colorVariable.name, $scope.colorMethod, $scope.colorScheme);
      }
    }

    $scope.variables = [];
    $scope.colorMethods = [];
    $scope.colorSchemes = [];
    $scope.colorVariable = undefined;
    $scope.colorMethod = undefined;
    $scope.colorScheme = undefined;

    $scope.$on('DataSet::schemaLoaded', function(e, schema) {
      $scope.dataAvailable = true;
      $scope.variables = _.filter(schema, function(variable) {
        return R.is.numeric(variable.type)
      });
      $scope.colorVariable = undefined;
    });
    
    $scope.$on("Colors::configurationLoaded", function(e, config) {
      d.config = config;
    });

    $scope.$watch('colorVariable', configureColorMethods);
    $scope.$watch('colorMethod', configureColorMethods);
  });
