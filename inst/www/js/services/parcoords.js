'use strict';

// This service is meant to share state betweem the parcoords visualization and
// the various control widgets

angular.module('contigBinningApp.services')
  .service('ParCoords', function($rootScope, R) {
    
    var d = {
      variables: [],         // List of variables that can be displayed in parcoords.
      selectedVariables: [], // List of variables currently displayed in parcoords.
      
      selectionText: "",
      selectionTextLong: "",

      brushPredicates: ["AND", "OR"],
      brushPredicate: undefined
    };
    
    function setVariables(schema) {
      if (schema === undefined) {
        d.variables = [];
      } else {
        d.variables = _.filter(schema, function(variable) {
          return R.is.numeric(variable.type) ||
            R.is.factor(variable.type);
        });
        d.selectedVariables = [];
      }
    }
    
    d.updateSelectedVariables = function(variables) {
      var text = _.reduce(variables, function(str, variable) {
        return str === "" ? variable.name : str + ", " + variable.name;
      }, "");
      
      if (text.length > "Select variables...".length) {
        d.selectionTextLong = text;
        text = "Selected " + variables.length + " variables";
      }

      d.selectionText = text;
      d.selectedVariables = variables;
      $rootScope.$broadcast("ParCoords::selectedVariablesChanged");
    }

    d.updateBrushPredicate = function(newPredicate) {
      if (d.brushPredicate !== newPredicate) {
        d.brushPredicate = newPredicate;
        $rootScope.$broadcast("ParCoords::brushPredicateChanged", d.brushPredicate);
      }
    };
    
    $rootScope.$on('DataSet::schemaLoaded', function(e, schema) {
      setVariables(schema);
      
      var variables = _.filter(d.variables, function(variable) {
        return R.is.numeric(variable["type"]) &&
          (variable["group.type"] === "Characteristics"
          || variable["group.type"] === "TimeSeries")
      });
      d.updateSelectedVariables(variables);
    });
   
    return d;
  });
