/*jslint indent: 2 */
/*global angular */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
