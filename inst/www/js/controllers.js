'use strict';

angular.module('contigBinningApp.controllers', [])

  .controller('ParcoordsCtrl', ['$scope', '$element', '$http',
    function ($scope, $element, $http) {

    /// private Controller vars
    var dataUrl = '/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true';
    var parcoords = d3.parcoords()($element[0])
      .mode("queue")
      .rate(250)
      .alpha(0.05)
      .render()
      .createAxes()
      .brushable()
      .reorderable();

    /// Private controller functions
    function convertRTypeToJSType(rtype) {
      switch(rtype) {
      case "numeric":
      case "integer":
        return "number";
      case "character":
        return "string";
      default:
        throw("convertRTypeToJSType: unhandled R-type: " + rtype);
      }
    }

    /**
     * The schema as returned by our R script contains R specific types for the
     * variables. We need to JSIfy this schema to make it work with
     * d3.parcoords.js.
     */
    function cleanSchema(schema) {
      var cleanedSchema = {};
      // For each key-value pair in the schema, convert the r type to a js type.
      _.each(schema, function(value, key) {
        cleanedSchema[key] = convertRTypeToJSType(value);
      });
      return cleanedSchema;
    };

    function getNumericDims(schema) {
      return _.map(
        _.filter(_.pairs(schema), function(pair) {
          return pair[1] === "number";
        }),
        function(pair) {
          return pair[0];
        }
      );
    };

    /// Scope extensions
    $scope.fetch = function() {
      $http({method: 'GET', url: dataUrl})
        .success(function(data, status, headers, config) {
          $scope.schema = cleanSchema(data.schema);
          $scope.dims = getNumericDims($scope.schema);
          parcoords
            .dimensions($scope.dims)
            .types($scope.schema)
            .data(data.data)
            .render()
            .updateAxes();
        })
        .error(function(data, status, headers, config) {
          console.log("BOOOH");
        });
    };

    // Trigger a first fetch of the data.
    $scope.fetch();
  }])

  .controller('FilterCtrl', function ($scope) {

  });
