/*jslint indent: 2 */
/*global angular */

angular.module('contigBinningApp.controllers')
  .controller('NameHighlightCtrl', function ($scope, DataSet, ParCoords) {

    'use strict';

    var nameHash = {},
      variables = [];

    function buildNameHash(data) {
      nameHash = {};
      data.forEach(function (d, dataIndex) {
        variables.forEach(function (v) {
          nameHash[d[v]] = dataIndex;
        });
      });

      $scope.noHighlightAvailable = false;
      // if a row is highlighted before the event that caused the rebuild
      // we still want it to be highlighted after
      $scope.highlightRow();
    }

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      variables = [];
      schema.forEach(function (d) {
        if (d.group === "Id") {
          variables.push(d.name);
        }
      });

      if (variables.length > 0) {
        DataSet.get(variables, buildNameHash);
      }
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DataSet::filtered', function (e, filteredData) {
      // remove highlight... it will be reapplied once the filter returns
      ParCoords.highlightRow(-1);
      if (variables.length > 0) {
        buildNameHash(filteredData);
      }
    });
    /*jslint unparam: false */


    $scope.noHighlightAvailable = true;

    $scope.highlightRow = function () {
      // called by ng_change directive on the rowName input in the UI
      var highlightIndex = -1;
      if (nameHash.hasOwnProperty($scope.rowName)) {
        highlightIndex = nameHash[$scope.rowName];
      }
      ParCoords.highlightRow(highlightIndex);
    };

  });
