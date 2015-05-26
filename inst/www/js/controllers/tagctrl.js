/*jslint indent: 2, nomen: true  */
/*global angular, _ */

angular.module('contigBinningApp.controllers')
  .controller('TagCtrl', function ($scope, DataSet, Tag) {

    'use strict';

    // modify tag:
    $scope.tags = [];
    $scope.itemsBrushed = false;
    $scope.modifyTag = "";
    $scope.modifyTagExists = false;
    $scope.placeholder = "selection1";


    function checkIfMofidyTagExists() {
      $scope.modifyTagExists = _.some($scope.tags, function (tag) {
        return tag === $scope.modifyTag;
      });
    }

    $scope.$on("Tag::tagsLoaded", function () {
      $scope.tags = Tag.tags();

      $scope.selectedTags = _.filter($scope.selectedTags, function (selectedTag) {
        return _.some($scope.tags, function (tag) {
          return selectedTag === tag;
        });
      });

      checkIfMofidyTagExists();
    });

    $scope.$watch("modifyTag", function () {
      checkIfMofidyTagExists();
    });

    $scope.createTag = function () {
      Tag.storeTag($scope.modifyTag);
    };

    $scope.addToTag = function () {
      Tag.appendToTag($scope.modifyTag);
    };

    // select tags:
    $scope.dataFiltered = false;
    $scope.filteringInProgress = false;
    $scope.selectedTags = [];
    $scope.enableDeselect = false;

    $scope.removeTags = function () {
      Tag.removeTags($scope.selectedTags);
    };

    $scope.selectTagged = function () {
      Tag.selectTagged($scope.selectedTags);
    };

    $scope.deselectTags = function () {
      Tag.selectTagged([]);
      $scope.enableDeselect = false;
    };

    $scope.keepSelected = function () {
      $scope.selectTagged();
      $scope.filteringInProgress = true;
      DataSet.filter(DataSet.FilterMethod.KEEP);
    };

    $scope.removeSelected = function () {
      $scope.selectTagged();
      $scope.filteringInProgress = true;
      DataSet.filter(DataSet.FilterMethod.REMOVE);
    };

    $scope.reloadData = function () {
      DataSet.filter(DataSet.FilterMethod.RESET);
    };

    $scope.$on('DataSet::loaded', function () {
      $scope.dataFiltered = false;
      $scope.tags = Tag.tags();
    });

    $scope.$on('DataSet::filtered', function () {
      $scope.filteringInProgress = false;
      $scope.dataFiltered = DataSet.filtered();
      Tag.removeNonPresentTags();
    });

    $scope.$on('DataSet::brushed', function (e, rows, method) {
      /*jslint unparam: true*/
      $scope.enableDeselect = method === "tag";

      $scope.itemsBrushed = rows.length > 0;
    });
  });
