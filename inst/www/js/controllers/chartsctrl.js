/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, d3, ocpu, _, $*/

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ChartsCtrl', function ($scope) {
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
