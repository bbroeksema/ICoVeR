/*jslint indent: 2, nomen: true  */
/*global angular, _ */

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
