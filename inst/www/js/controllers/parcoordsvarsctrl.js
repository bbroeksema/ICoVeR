angular.module('contigBinningApp.controllers')
  .controller('ParCoordsVarsCtrl', function($modal, $scope, ParCoords) {

    $scope.parcoords = ParCoords;
    
    $scope.openSelectionDialog = function() {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function() {
            return $scope.parcoords.variables;
          },
          selected: function() {
            return $scope.parcoords.selectedVariables;
          }
        }
      });

      dialog.result.then($scope.parcoords.updateSelectedVariables);
    };
    
  });