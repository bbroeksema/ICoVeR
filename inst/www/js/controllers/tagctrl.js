/*jslint indent: 2, nomen: true  */
/*global angular, _ */

angular.module('contigBinningApp.controllers')
  .controller('TagCtrl', function ($scope, $modal, DataSet) {

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

    $scope.$watch("selectedTag", function () {
      // For some reason angular is being inconsistent here. When the default option "-- new selection --"
      // is chosen sometimes it is given as null and sometimes as undefined.
      if ($scope.selectedTag === null) {
        $scope.selectedTag = undefined;
      }
    });

    $scope.createTag = function () {
      var tag = "selection" + $scope.tags.length,
        dialog = $modal.open({
          templateUrl: 'js/templates/givename.html',
          size: 'sm',
          controller: 'NameSelectionCtrl',
          resolve: {
            selectedName: function () {
              return tag;
            }
          }
        });

      function addTag(selectionName) {
        $scope.selectedTag = selectionName;
        $scope.tags.push(selectionName);

        addTagVariable(selectionName);
      }

      dialog.result.then(addTag);
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
