/*jslint indent: 2, nomen: true */
/*global angular, _*/

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ExportCtrl', function (DataSet, $rootScope, $scope) {
    var d = {
      rows: [],
      variables: [],
      rowIdMap: {}
    };

    $scope.contigIds = "";
    $scope.exportMethods = ["all"];
    $scope.exportMethod = $scope.exportMethods[0];

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      // FIXME: This is not generic at, but we need something working now.
      DataSet.get(["contig"], function (data) {
        d.rowIdMap = {};
        _.map(data, function (datum) {
          d.rowIdMap[datum.row] = datum.contig;
        });
      });
    });

    /*jslint unparam: true */
    $rootScope.$on("DataSet::brushed", function (ev, extents, rows) {
      d.rows = rows;
      if (Object.getOwnPropertyNames(extents).length > 0) {
        $scope.exportMethods = ["all", "brushed"];
        $scope.exportMethod = $scope.exportMethods[1];
      } else {
        $scope.exportMethods = ["all"];
        $scope.exportMethod = $scope.exportMethods[0];
      }
    });
    /*jslint unparam: false */

    $scope.export = function () {
      var contigIds = "";
      _.map(d.rows, function (datum) {
        contigIds += d.rowIdMap[datum.row] + "\n";
      });
      $scope.contigIds = contigIds;
    };

  });
