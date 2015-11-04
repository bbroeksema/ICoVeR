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
        variablesToUpdate: [], // List of variables that need to be updated because they have changed.

        sharedScaleVariables: [], // List of variables for which the same scale should be used.
        scaleText: "None",
        scaleTextLong: "No variables share the same scale.",

        selectionText: "None",
        selectionTextLong: "None",

        variableSorting: "none",

        brushPredicates: ["AND", "OR"],
        brushPredicate: undefined,
        highlightFunction: undefined
      };

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

    d.resetSelectedVariables = function () {
      d.selectedVariables = [];

      var variables = _.filter(d.variables, function (variable) {
        return R.is.numeric(variable.type) &&
          (variable.group_type === "Characteristics"
          || variable.group_type === "TimeSeries");
      });

      d.updateSelectedVariables(variables);
    };

    d.shareScales = function (variables) {
      var text = _.reduce(variables, function (str, variable) {
        return str === "" ? variable.name : str + ", " + variable.name;
      }, "");

      if (text.length > "Select variables...".length) {
        d.scaleTextLong = text;
        text = variables.length + " variables share same scale";
      }

      d.scaleText = text;
      d.sharedScaleVariables = variables;
      $rootScope.$broadcast("ParCoords::scaleSharingVariablesChanged");
    };

    d.resetScales = function () {
      d.scaleText = "None";
      d.scaleTextLong = "No variables share the same scale.";
      d.sharedScaleVariables = [];
      $rootScope.$broadcast("ParCoords::scaleSharingVariablesChanged");
    };

    d.updateBrushPredicate = function (newPredicate) {
      if (d.brushPredicate !== newPredicate) {
        d.brushPredicate = newPredicate;
        $rootScope.$broadcast("ParCoords::brushPredicateChanged", d.brushPredicate);
      }
    };

    d.updateSortingMethod = function (sortingMethod) {
      if (d.variableSorting !== sortingMethod) {
        d.variableSorting = sortingMethod;
        $rootScope.$broadcast("ParCoords::variableSortingChanged", d.variableSorting);
      }
    };

    d.changeTheme = function (newTheme) {
      var brushedColor = "white";

      if (newTheme === 'light') {
        brushedColor = "black";
      }

      $rootScope.$broadcast("ParCoords::brushedColorChanged", brushedColor);
    };

    /*jslint unparam: true */
    $rootScope.$on('DimRedPlot::variablesSelected', function (e, method, variableSelection) {
      var groupList = [],
        typeList = [];

      _.forEach(variableSelection, function (variable) {
        if (variable.selected) {
          var variableSchema = _.find(d.variables, "name", variable.name);

          groupList.push(variableSchema.group);
          typeList.push(variableSchema.type);
        }
      });

      groupList = _.uniq(groupList);
      typeList = _.uniq(typeList);

      d.selectedVariables = _.filter(d.selectedVariables, function (variable) {
        return _.indexOf(groupList, variable.group) === -1 ||
               _.indexOf(typeList, variable.type) === -1;
      });

      _.forEach(variableSelection, function (variable) {
        if (variable.selected) {
          d.selectedVariables.push(_.find(d.variables, "name", variable.name));
        } else {
          var index = _.findIndex(d.selectedVariables, "name", variable.name);
          if (index !== -1) {
            d.selectedVariables.splice(index, 1);
          }
        }
      });

      if (d.selectedVariables.length === 0) {
        d.resetSelectedVariables();
      } else {
        d.updateSelectedVariables(d.selectedVariables);
      }
    });

    $rootScope.$on('DataSet::schemaLoaded', function (e, schema) {
      if (schema === undefined) {
        d.variables = [];
      } else {
        d.variables = _.filter(schema, function (variable) {
          return R.is.numeric(variable.type) ||
            R.is.factor(variable.type);
        });

        // It could be that variables have been removes, so we need to check this.
        var intersection = _.intersection(_.pluck(d.selectedVariables, "name"), _.pluck(d.variables, "name"));

        if (intersection.length !== d.selectedVariables.length) {
          intersection = _.map(intersection, function (name) {
            return _.find(d.variables, "name", name);
          });

          d.updateSelectedVariables(intersection);
        }
      }
    });

    $rootScope.$on('DataSet::initialDataLoaded', d.resetSelectedVariables);

    $rootScope.$on('DataSet::analyticsUpdated', function (e, analyticsVariable) {
      // If the analytics have not been in the data before we can add them normally
      if (!_.any(d.selectedVariables, { name: analyticsVariable.name })) {
        if (analyticsVariable.name.indexOf("contribution") === -1) {
          d.selectedVariables.push(analyticsVariable);
          d.updateSelectedVariables(d.selectedVariables);
          d.variablesToUpdate.push(analyticsVariable);
        }
      } else {
        d.variablesToUpdate.push(analyticsVariable);
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
