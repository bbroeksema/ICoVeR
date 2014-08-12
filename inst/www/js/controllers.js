'use strict';

angular.module('contigBinningApp.controllers', [])

  .controller('ParcoordsCtrl', function ($scope, $element, DataSet) {
    // Trigger an initial fetch. This should be moved somewhere else, a
    // top-level controller. Putting it in the PC controller is a bit arbitrary.
    DataSet.load();

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
      if (d.length !== $scope.data.length) {
        DataSet.brush(d);
      } else {
        DataSet.brush([]);
      }
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
    $scope.$on("Data::loaded", function() {
      $scope.brushed = [];
      $scope.data = DataSet.data;
      var schema = cleanSchema(DataSet.schema);
      var dims = getNumericDims(schema);

      parcoords
        .dimensions(dims)
        .types(schema)
        .data(DataSet.data)
        .render()
        .updateAxes();
    });
  })

  .controller('FilterCtrl', function ($scope, $rootScope, DataSet) {
    $scope.brushed = [];
    $scope.$on('Data::brushed', function() {
      $scope.brushed = DataSet.brushed;
      $scope.$apply();
    });
  })

  .service('DataSet', function($rootScope, $http) {
    var dataUrl = '/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true';

    return {
      data: [],
      schema: {},
      brushed: [],

      brush: function(brushed) {
        this.brushed = brushed;
        $rootScope.$broadcast("Data::brushed")
      },

      load: function() {
        var me = this;
        var request = $http({method: 'GET', url: dataUrl});
        request.success(function(data, status, headers, config) {
          me.data = data.data;
          me.schema = data.schema;
          $rootScope.$broadcast("Data::loaded")
        });
        request.error(function(data, status, headers, config) {
          console.log("Loading failed");
          // TODO: Implement proper error handling.
          //$rootScope.$broadcast("Data::loadingFailed");
        });
      }
    };
  });
