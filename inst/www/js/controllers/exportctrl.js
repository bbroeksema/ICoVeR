/*jslint indent: 2, nomen: true */
/*global angular, _*/

angular.module('contigBinningApp.controllers')
  .controller('ExportCtrl', function ($rootScope, $scope, OpenCPU) {

    'use strict';

    var d = {
      rows: []
    };

    $scope.url = undefined;
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

    $scope.export = function () {
      var rows = _.map(d.rows, function (row) { return row.row; });

      $scope.url = undefined;

      OpenCPU.call("contigs.export", { rows: rows }, function (session) {
        $scope.$apply(function () {
          $scope.url = session.getFileURL("x.fasta");
        });
      });
    };

  });
