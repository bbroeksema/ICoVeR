'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ParcoordsCtrl', function($scope, $element, DataSet) {

    /// private Controller vars
    var parcoords = d3.parcoords()($element[0])
      .mode("queue")
      .rate(250)
      .alpha(0.05)
      .render()
      .createAxes()
      .brushable()
      .reorderable();

    parcoords.on("brushend", function(d) {
      // NOTE: the brushend event from parcoords is "outside" angular, so we
      //       have to wrap it in $scope.$apply to make sure that other
      //       controllers are updated appropriately.
      $scope.$apply(function() {
        DataSet.brush(parcoords.brushExtents());
      });
    });

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
    $scope.$on("DataSet::loaded", function(e, schema, data) {
      $scope.brushed = [];
      var schema = cleanSchema(schema);
      var dims = getNumericDims(schema);

      parcoords
        .dimensions(dims)
        .types(schema)
        .data(data)
        .render()
        .updateAxes();
    });
  });
