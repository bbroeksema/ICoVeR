'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ParcoordsCtrl', function($scope, $element, DataSet, R) {

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

    /// Scope extensions
    $scope.$on("DataSet::schemaLoaded", function(e, schema) {
      // As a heuristic (which works for Hydviga) we only take variables that
      // are numeric and which belong to a Characteristics or TimeSeries group.
     var dims = _.filter(schema, function(variable) {
        return R.is.numeric(variable["type"]) &&
          (variable["group.type"] === "Characteristics"
          || variable["group.type"] === "TimeSeries")
      });

      dims = _.map(dims, function(variable) {
        return variable['name'];
      });

      var types = {};
      _.each(dims, function(dim) {
        types[dim] = "number";
      });

      parcoords
        .dimensions(dims)
        .types(types);

      DataSet.get(dims, render);
    });

    function render(session, data) {
      $scope.brushed = [];
      parcoords
        .data(data)
        .autoscale()
        .render()
        .updateAxes();
    };

    $scope.$on("DataSet::filtered", function(e, data) {
      $scope.brushed = [];
      $scope.data = data;

      parcoords
        .brushReset()
        .data(data)
        .autoscale()
        .render()
        .updateAxes();
    })
  });
