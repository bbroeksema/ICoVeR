/*jslint indent: 2*/
/*global angular */

angular.module('contigBinningApp.controllers')
  .controller('ParCoordsVarsCtrl', function ($modal, $scope, ParCoords) {

    'use strict';

    $scope.parcoords = ParCoords;
    $scope.brushPredicate = $scope.parcoords.brushPredicates[0];
    $scope.variableSorting = "none";

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

    $scope.$watch("brushPredicate", function (newPredicate) {
      $scope.parcoords.updateBrushPredicate(newPredicate);
    });
  });
