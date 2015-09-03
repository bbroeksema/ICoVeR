/*jslint indent: 2, nomen: true */
/*global angular, _*/

angular.module('contigBinningApp.controllers')
  .controller('ExportCtrl', function ($rootScope, $scope, DataSet) {

    'use strict';

    var d = {
      all: [],
      rows: []
    };

    $scope.url = undefined;
    $scope.idStrings = "";
    $scope.exportMethods = ["all"];
    $scope.exportMethod = $scope.exportMethods[0];

    /*jslint unparam: true */
    $rootScope.$on("DataSet::brushed", function (ev, rows) {
      d.rows = rows;
      // Reset the url on brush change to avoid confusion of what is being
      // exported when clicking the url.
      $scope.url = undefined;

      if (rows.length > 0) {
        $scope.exportMethods = ["all", "brushed"];
        $scope.exportMethod = $scope.exportMethods[1];
      } else {
        $scope.exportMethods = ["all"];
        $scope.exportMethod = $scope.exportMethods[0];
      }
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      DataSet.get(["CONTIG"], function (data) {
        d.all = data;
      });
    });
    /*jslint unparam: false */

    $scope.export = function () {
      var data = d.rows.length > 0 ? d.rows : d.all,
        rows = _.map(data, function (row) { return row.CONTIG; });

      $scope.idStrings = _.reduce(rows, function (str, id) {
        return str + (str.length > 0 ? "\n" : "") + id;
      }, "");
    };

  });
