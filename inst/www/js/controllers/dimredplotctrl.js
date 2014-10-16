'use strict';

/*global angular, crpgl, d3, ocpu, _, $*/
/*jslint browser: true, todo:true, unparam: true*/

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $element, $window, OpenCPU, Analytics) {

    var plot = crpgl.DimRedPlot(),
        data,
        pair = 1,
        clusterCount = 1;

    plot
      .originSize(30)
      .originVisible(true)
      .on("rotate", rotate)
      .on("pointclick", function(values) {
        // For now, it is assumed that elements in @param values are actual
        // column names of the table in the back-end. The thing that needs to
        // happen at this point is that, in the backend a new variable is
        // generated, that consists of the weighted sum of @param values for
        // each observation in the original data table.
        Analytics.summarize(values);
      });

    function rotate(drp, direction) {
      var update = false;
      if (direction === "up" && pair > 1) {
        pair = pair - 1;
        update = true;
      } else if (direction === "down" && pair < data.explainedVariance.length -1) {
        pair = pair + 1;
        update = true;
      }

      if (update) {
        data.actives = [pair, pair + 1];
        d3.select($element[0])
          .datum(data)
          .call(plot);
      }
    }

    // TODO: Connect slider changes to this function.
    function cluster(drp, newClusterCount) {
      var clusteredData = {
            projections: data.projections,
            actives: data.actives,
            explainedVariance: data.explainedVariance
          };

      if (clusterCount === newClusterCount) {
        return; // Nothing to do.
      }

      clusterCount = newClusterCount;
      if (clusterCount > 1) {
        var prop = { cluster: "clustering." + pair  + "." + clusterCount },
            clustered = _.groupBy(data.projections, prop.cluster),
            points = [];

        prop.factorX = "factor." + data.actives[0];
        prop.factorY = "factor." + data.actives[1];
        prop.contribX = "contrib." + data.actives[0];
        prop.contribY = "contrib." + data.actives[1];

        clusteredData.actives = data.actives;

        _.forIn(clustered, function(cluster, id) {
          // cluster is an array of points.
          // The position of the cluster is determined by taking averages for
          // x and y positions. The size of the cluster is determined by
          // summing contributions.
          var clusterPoint = {};
          clusterPoint[prop.factorX] = 0;
          clusterPoint[prop.factorY] = 0;
          clusterPoint[prop.contribX] = 0;
          clusterPoint[prop.contribY] = 0;
          clusterPoint.points = cluster;

          _.forEach(cluster, function(point) {
            clusterPoint[prop.factorX] += point[prop.factorX];
            clusterPoint[prop.factorY] += point[prop.factorY];
            clusterPoint[prop.contribX] += point[prop.contribX];
            clusterPoint[prop.contribY] += point[prop.contribY];
          });

          // Average the position
          clusterPoint[prop.factorX] /= cluster.length;
          clusterPoint[prop.factorY] /= cluster.length;
          points.push(clusterPoint);
        });

        clusteredData.projections = points;
      }

      d3.select($element[0])
        .datum(clusteredData)
        .call(plot);
    }

    function resize() {
      plot
        .width($element[0].clientWidth)
        .height($element[0].clientHeight);
      d3.select($element[0]).call(plot);
    }

    function updatePlot(dimRedData) {
      data = dimRedData;
      data.actives = [pair, pair + 1];
      // TODO: Introduce various ways to 'cut' the number of principal axes.
      //       Various approaches could be taken, such as taking the axes upto
      //       a certain amount of explained variances or retaint only the
      //       first N principal axes. In both cases the variance and N should
      //       be configurable by the user.
      //data.explainedVariance = data.explainedVariance.slice(0, 10);

      d3.select($element[0])
        .datum(data)
        .call(plot);
    }

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    $scope.$on("Analytics::dimensionalityReduced", function(ev, method, session) {
      session.getObject(updatePlot);
    });
    $scope.$on("DimRedDisplay::cluster", function(ev, clusterCount){
      cluster(null, clusterCount);
    });
  });
