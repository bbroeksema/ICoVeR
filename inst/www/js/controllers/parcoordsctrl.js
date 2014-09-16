'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ParcoordsCtrl', function($scope, $window, $element, DataSet, ParCoords) {

    /// private Controller vars
    var d = {
      parcoords: d3.parcoords()($element[0]),
    };

    /// private controller functions
    function resize() {
      d.parcoords
        .width($element[0].clientWidth)
        .height($element[0].clientHeight)
        .resize();
    }

    function render() {
      $scope.brushed = [];
      d.parcoords
        .brushReset()
        .autoscale()
        .updateAxes()
        .render();
    }

    /// Initialization
    d.parcoords
      .mode("queue")
      .rate(250)
      .alpha(0.05)
      .render()
      .createAxes()
      .brushable()
      .reorderable()
      .on("brushend", function() {
        // NOTE: the brushend event from parcoords is "outside" angular, so we
        //       have to wrap it in $scope.$apply to make sure that other
        //       controllers are updated appropriately.
        $scope.$apply(function() {
          DataSet.brush(d.parcoords.brushExtents(), d.parcoords.brushed());
        });
      });

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    /// Scope extensions
    // For some reason $scope.$watch(ParCoords.selectedVariables), doesn't
    // work. So for now, I'll fall back to the more reliable broadcast
    //meganism.
    $scope.$on("ParCoords::selectedVariablesChanged", function() {
      var dims = _.map(ParCoords.selectedVariables, function(variable) {
        return variable['name'];
      });

      var types = {};
      _.each(dims, function(dim) {
        types[dim] = "number";
      });

      d.parcoords
        .dimensions(dims)
        .types(types);

      DataSet.get(dims);
    });
    
    $scope.$on("DataSet::dataLoaded", function(ev, data) {
      d.parcoords.data(data);
      render();
    });

    $scope.$on("DataSet::filtered", function(ev, filterMethod) {
      DataSet.get(d.parcoords.dimensions());
    });

    $scope.$on("Colors::changed", function(e, colors) {
      function colorfn(d, i) {
        return colors.hasOwnProperty(d.row) ? colors[d.row] : "#000";
      };
      d.parcoords.color(colorfn);
      render();
    });
  });
