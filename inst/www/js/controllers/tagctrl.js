/*jslint indent: 2, nomen: true  */
/*global angular, _ */

angular.module('contigBinningApp.controllers')
  .controller('TagCtrl', function ($scope, DataSet) {

    'use strict';

    $scope.tags = [];
    /*
    {
      name: "",
      rows: []
    }
     */
    $scope.itemsBrushed = false;
    $scope.selectedTag = undefined;

    function addTagVariable(tag) {
      var rows = Array.apply(null, new Array(DataSet.data().length)).map(Boolean.prototype.valueOf, false);

      DataSet.brushed().forEach(function (row) {
        rows[row.row] = true;
      });

      DataSet.addVariable(tag, rows, "boolean", "Tags");
    }

    $scope.createTag = function () {
      var tag = "tag" + $scope.tags.length;

      $scope.selectedTag = tag;
      $scope.tags.push(tag);

      addTagVariable(tag);
    };

    $scope.assignTag = function () {
      addTagVariable($scope.selectedTag);
    };

    $scope.selectTag = function () {
      var brushed = [];

      DataSet.get([$scope.selectedTag], function (rows) {
        brushed = DataSet.data().filter(function (row, rowIdx) {
          /*jslint unparam:true*/
          return rows[rowIdx][$scope.selectedTag];
        });
      });

      DataSet.brush(brushed, "tag");
    };

    $scope.removeTag = function () {
      var index = _.findIndex($scope.tags, $scope.selectedTag);

      $scope.tags.splice(index, 1);
      DataSet.removeVariable($scope.selectedTag);
      $scope.selectedTag = undefined;
    };

    $scope.$on('DataSet::brushed', function (e, rows, method) {
      /*jslint unparam: true*/
      if (method !== "tag") {
        $scope.itemsBrushed = rows.length > 0;
        $scope.selectedTag = undefined;
      }
    });
  });
