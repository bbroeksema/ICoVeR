/*jslint indent: 2 */
/*global angular */

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('NameHighlightCtrl', function ($scope, DataSet, ParCoords) {
    var nameHash = {},
      variables = [];

    function buildNameHash(data) {
      nameHash = {};
      data.forEach(function (d, dataIndex) {
        variables.forEach(function (v) {
          nameHash[d[v]] = dataIndex;
        });
      });
    }

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      variables = [];
      schema.forEach(function (d) {
        if (d.group === "Id") {
          variables.push(d.name);
        }
      });
      DataSet.get(variables, buildNameHash);
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DataSet::filtered', function (e, schema) {
      DataSet.get(variables, buildNameHash);
    });
    /*jslint unparam: false */
    $scope.highlightRow = function () {
      // called by ng_change directive on the rowName input in the UI
      var highlightIndex = -1;
      if (nameHash.hasOwnProperty($scope.rowName)) {
        highlightIndex = nameHash[$scope.rowName];
      }
      ParCoords.highlightRow(highlightIndex);
    };

  });

