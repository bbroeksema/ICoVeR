/*jslint indent: 2*/
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
  .controller('ParCoordsVarsCtrl', function ($modal, $scope, ParCoords) {

    'use strict';

    $scope.parcoords = ParCoords;
    $scope.brushPredicate = $scope.parcoords.brushPredicates[0];
    $scope.variableSorting = "none";
    $scope.noSharedScales = true;

    $scope.openSelectionDialog = function () {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function () {
            return $scope.parcoords.variables;
          },
          selected: function () {
            return $scope.parcoords.selectedVariables;
          }
        }
      });

      dialog.result.then($scope.parcoords.updateSelectedVariables);
    };

    $scope.$watch('variableSorting', function (sortingMethod) {
      $scope.parcoords.updateSortingMethod(sortingMethod);
    });

    $scope.openScaleBindDialog = function () {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function () {
            return $scope.parcoords.selectedVariables;
          },
          selected: function () {
            return $scope.parcoords.sharedScaleVariables;
          }
        }
      });

      dialog.result.then(function (variables) {
        $scope.parcoords.shareScales(variables);
        $scope.noSharedScales = variables.length === 0;
      });
    };

    $scope.resetScales = function () {
      $scope.parcoords.resetScales();
      $scope.noSharedScales = true;
    };

    $scope.$watch("brushPredicate", function (newPredicate) {
      $scope.parcoords.updateBrushPredicate(newPredicate);
    });
  });
