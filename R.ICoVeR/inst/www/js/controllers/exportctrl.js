/*jslint indent: 2, nomen: true */
/*global angular, _*/

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.

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
