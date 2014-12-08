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
      var idFields, hasIdFields = true;

      idFields = _.chain(schema)
        .filter({ 'group_type': 'Id' })
        .pluck('name')
        .value();

      if (idFields.length === 0) {
        idFields.push(schema[0].name);
        hasIdFields = false;
      }

      DataSet.get(idFields, function (data) {
        d.rows = data;
        d.rowIdMap = {};

        if (hasIdFields) {
          _.each(data, function (datum) {
            var idFieldStrings = _.map(idFields, function (field) {
              return field + ": " + datum[field];
            });
            d.rowIdMap[datum.row] = idFieldStrings.join(', ');
          });
        } else {
          _.each(data, function (datum) {
            d.rowIdMap[datum.row] = "row: " + datum.row;
          });
        }
      });
    });

    /*jslint unparam: true */
    $rootScope.$on("DataSet::brushed", function (ev, extents, rows) {
      var nExtents = Object.getOwnPropertyNames(extents.extents).length,
        categories = Object.getOwnPropertyNames(extents.categories).length;

      d.rows = rows;
      if ((nExtents + categories) > 0) {
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
