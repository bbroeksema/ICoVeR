/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, d3, ocpu, _, $*/

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('MapCtrl', function ($scope, $element, $window, DataSet) {

    var plot = crpgl.MapPlot(),
      location,
      data = [],
      index = {},
      highlighted = [];

    function render(cfg) {
      data.render = cfg || { data: true, highlight: highlighted.length > 0 };
      data.highlighted = highlighted;

      d3.select($element[0])
        .data([data])
        .call(plot);
    }

    function resize() {
      plot
        .width($element[0].clientWidth)
        .height($element[0].clientHeight);
      render();
    }

    function retrieveData(updateExtents) {
      DataSet.get(_.keys(location), function (d) {
        var extent;

        data = d;
        index = _.indexBy(data, 'row');

        // HACK: If the last X-value is 49, than the extent should go up to 50
        //       in order to avoid the last column falling off the plot.
        //       This actually assumes integer values.
        if (updateExtents) {
          extent = d3.extent(data, function (d) { return d.x; });
          extent[1] = extent[1] + 1;
          plot.xDomain(extent);

          extent = d3.extent(data, function (d) { return d.y; });
          extent[1] = extent[1] + 1;
          plot.yDomain(extent);
        }
        render();
      });
    }
    retrieveData.UPDATE_EXTENTS = true;
    retrieveData.KEEP_EXTENTS = false;

    $scope.$parent.$watch('location', function (newLocation) {
      if (newLocation) {
        location = newLocation;
        retrieveData(retrieveData.UPDATE_EXTENTS);
      }
    });

    /*jslint unparam: true */
    $scope.$on('DataSet::brushed', function (e, extents, rows) {
      if (rows && rows.length > 0 && rows.length < data.length) {
        highlighted = _.map(rows, function (row) {
          return index[row.row];
        });
      } else {
        highlighted = [];
      }

      render({ highlight: true });
    });
    /*jslint unparam: false */

    $scope.$on('DataSet::filtered', function () {
      retrieveData(retrieveData.KEEP_EXTENTS);
      render();
    });

    /*jslint unparam: true */
    $scope.$on("Colors::changed", function (e, colors) {
      function colorfn(d) {
        return colors.hasOwnProperty(d.row) ? colors[d.row] : "#000";
      }
      plot.color(colorfn);
      render();
    });
    /*jslint unparam: false */

    $scope.$watch(
      function () {
        return [$element[0].clientWidth, $element[0].clientHeight].join('x');
      },
      function (value) {
        if (value !== "0x0") {
          resize();
        }
      }
    );

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);
  });
