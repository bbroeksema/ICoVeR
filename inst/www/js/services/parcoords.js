/*jslint white: false, indent: 2, nomen: true */
/*global angular, _ */

// This service is meant to share state betweem the parcoords visualization and
// the various control widgets

angular.module('contigBinningApp.services')
  .service('ParCoords', function ($rootScope, R) {

    'use strict';

    var d = {
        variables: [],         // List of variables that can be displayed in parcoords.
        selectedVariables: [], // List of variables currently displayed in parcoords.

        selectionText: "",
        selectionTextLong: "",

        brushPredicates: ["AND", "OR"],
        brushPredicate: undefined,
        highlightFunction: undefined
      };

    function setVariables(schema) {
      if (schema === undefined) {
        d.variables = [];
      } else {
        d.variables = _.filter(schema, function (variable) {
          return R.is.numeric(variable.type) ||
            R.is.factor(variable.type);
        });
        d.selectedVariables = [];
      }
    }

    d.updateSelectedVariables = function (variables) {
      var text = _.reduce(variables, function (str, variable) {
        return str === "" ? variable.name : str + ", " + variable.name;
      }, "");

      if (text.length > "Select variables...".length) {
        d.selectionTextLong = text;
        text = "Selected " + variables.length + " variables";
      }

      d.selectionText = text;
      d.selectedVariables = variables;
      $rootScope.$broadcast("ParCoords::selectedVariablesChanged");
    };

    d.changeBrushed = function (brushed) {
      $rootScope.$broadcast("ParCoords::brushed", brushed);
    };

    d.resetSelectedVariables = function () {
      d.selectedVariables = [];

      var variables = _.filter(d.variables, function (variable) {
        return R.is.numeric(variable.type) &&
          (variable.group_type === "Characteristics"
          || variable.group_type === "TimeSeries");
      });

      d.updateSelectedVariables(variables);
    };

    d.updateBrushPredicate = function (newPredicate) {
      if (d.brushPredicate !== newPredicate) {
        d.brushPredicate = newPredicate;
        $rootScope.$broadcast("ParCoords::brushPredicateChanged", d.brushPredicate);
      }
    };

    /*jslint unparam: true */
    $rootScope.$on('DataSet::schemaLoaded', function (e, schema) {
      var firstLoad = d.variables.length < 1,
        previousVariables =  d.selectedVariables;
      // set variables will empty d.selectedVariables
      setVariables(schema);
      if (firstLoad) {
        d.resetSelectedVariables();
      } else {
        d.updateSelectedVariables(previousVariables);
      }
    });

    $rootScope.$on('DataSet::analyticsDataAvailable', function (e, clusterVariable) {
      if (!_.any(d.selectedVariables, { name: clusterVariable.name })) {
        d.selectedVariables.push(clusterVariable);
        d.updateSelectedVariables(d.selectedVariables);
      }
    });

    $rootScope.$on("DimRedPlot::analyticsRemoved", function (ev, variableName) {
      var variableIdx = _.findIndex(d.selectedVariables, { name: variableName });

      if (variableIdx !== -1) {
        d.selectedVariables.splice(variableIdx, 1);
        d.updateSelectedVariables(d.selectedVariables);
      }
    });
    /*jslint unparam: false */

    d.setHighlightFunction = function (highlightFunc) {
      d.highlightFunction = highlightFunc;
    };

    d.highlightRow = function (rowIndex) {
      if (d.highlightFunction) {
        d.highlightFunction(rowIndex);
      }
    };

    return d;
  });
