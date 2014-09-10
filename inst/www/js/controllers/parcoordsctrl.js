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

    function render() {
      $scope.brushed = [];
      parcoords
        .brushReset()
        .autoscale()
        .updateAxes()
        .render();
    };
    
    var filterUpdate = {
      data: false,
      color: true // Initially we use the default color for now.
    }
    
    function updateData(session, data) {
      parcoords.data(data);
      filterUpdate.data = true;
      if (filterUpdate.color) {
        render();
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

      DataSet.get(dims, updateData);
    });

    $scope.$on("DataSet::filtered", function(ev, filterMethod) {
      // After a filter, we'll need to reload the colors as well. To avoid
      // double rendering, we just update the data here and let the color
      // callback do the axis update and the rendering.
      // @see $scope.$on("Colors::changed")
      filterUpdate.data = false;
      filterUpdate.color = false;
      DataSet.get(parcoords.dimensions(), updateData);
    });

    $scope.$on("Colors::changed", function(e, colors) {
      function colorfn(d, i) {
        return colors[i];
      };
      parcoords.color(colorfn);
      filterUpdate.color = true;
      if (filterUpdate.data) {
        render();
      }
    });
  });
