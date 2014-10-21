/*jslint indent: 2*/
/*global angular */

'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ParCoordsVarsCtrl', function ($modal, $scope, ParCoords) {

    $scope.parcoords = ParCoords;
    $scope.brushPredicate = $scope.parcoords.brushPredicates[0];

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

    $scope.$watch("brushPredicate", function (newPredicate) {
      $scope.parcoords.updateBrushPredicate(newPredicate);
    });
  });
