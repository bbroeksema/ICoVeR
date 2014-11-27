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

    $scope.idStrings = "";
    $scope.exportMethods = ["all"];
    $scope.exportMethod = $scope.exportMethods[0];

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      var idFields;

      idFields = _.chain(schema)
        .filter({ 'group_type': 'Id' })
        .pluck('name')
        .value();

      DataSet.get(idFields, function (data) {
        d.rowIdMap = {};
        _.each(data, function (datum) {
          var idFieldStrings = _.map(idFields, function (field) {
            return field + ": " + datum[field];
          });
          d.rows = data;
          d.rowIdMap[datum.row] = idFieldStrings.join(', ');
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
      var idStrings = "";
      _.map(d.rows, function (datum) {
        idStrings += d.rowIdMap[datum.row] + "\n";
      });
      $scope.idStrings = idStrings;
    };

  });
