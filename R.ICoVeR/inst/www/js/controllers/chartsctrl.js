/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, d3, ocpu, _, $*/

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
  .controller('ChartsCtrl', function ($scope) {

    'use strict';

    $scope.location = false;

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      // FIXME: we make a lot of assumptions in this function. For now this is
      //        just a quick hack to make things work (tm) for some initial
      //        testing with datasets that have spatial information.

      // For this widget to work, the schema must have a group with the type
      // Location.*, which must in turn have an x and y variable.
      function selector(v) {
        return v.group_type === 'Location.Dense' || v.group_type === 'Location.Sparse';
      }

      var location = _.groupBy(_.select(schema, selector), 'group');
      // For now we only support one location, so let's get the first one.
      if (_.keys(location).length > 0) {
        $scope.location = _.groupBy(location[_.first(_.keys(location))], 'name');
      }
    });
    /*jslint unparam: false */
  });
