'use strict';

angular.module('contigBinningApp.controllers')
  .controller('NameHighlightCtrl', function ($scope,DataSet,ParCoords) {
    var nameHash = {};
    var variables = [];

    function buildNameHash(data){
      nameHash = {};
      data.forEach(function(d,dataIndex) {
        variables.forEach(function(v){
          nameHash[d[v]] = dataIndex;
        });
      });
    }

    $scope.$on('DataSet::schemaLoaded', function(e, schema) {
     variables = [];
     console.log("Schema Recieved");
     schema.forEach(function(d){
       if(d.group ==="Id") {
         variables.push(d.name);
       }
     });
      DataSet.get(variables,buildNameHash);
    });

   $scope.highlightRow = function() {
     // called by ng_change directive on the rowName input in the UI
     var highlightIndex = -1;
     if(nameHash.hasOwnProperty($scope.rowName)) {
       highlightIndex = nameHash[$scope.rowName];
     } 
     ParCoords.highlightRow(highlightIndex);
   }

  });