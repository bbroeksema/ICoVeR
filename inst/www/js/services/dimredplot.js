/*jslint white: false, indent: 2, nomen: true */
/*global angular, _, list, d3 */

// This service is meant to share state betweem the parcoords visualization and
// the various control widgets

angular.module('contigBinningApp.services')
  .service('DimRedPlot', function ($rootScope, ParCoords) {

    'use strict';

    var d = {
      data: null,
      selections: {
        variable: {},
        individual: {}
      },
      influences: {
        variable: {},
        individual: {}
      }
    };

    function resetStates() {
      d.selections.variable = {};
      d.selections.individual = {};
      d.influences.variable = {};
      d.influences.individual = {};

      d.data.processedData.forEach(function (row) {
        d.selections.individual[row.name] = list.selected.NONE;
        d.influences.individual[row.name] = 0;
      });

      var colName;

      if (d.data.processedData.length === 0) {
        return;
      }

      for (colName in d.data.processedData[0]) {
        if (d.data.processedData[0].hasOwnProperty(colName)) {
          d.selections.variable[colName] = list.selected.NONE;
          d.influences.variable[colName] = 0;
        }
      }
    }

    // Makes sure that the labels of points are no longer than 80px
    function createWrappedLabels(points) {
      var testText = d3.select("body").append("div").style("float", "left");

      testText.style("font-size", "8px");

      function wrap(d, i) {
        /*jslint unparam:true*/
        var textLength,
          string,
          desiredStringLength;

        testText.text(d.label);
        textLength = testText.node().offsetWidth;

        string = d.label;
        desiredStringLength = Math.ceil(80 / textLength * string.length);

        string = string.slice(0, desiredStringLength);
        testText.text(string);
        textLength = testText.node().clientWidth;

        while (textLength > 80 && string.length > 0) {
          string = string.slice(0, -1);
          testText.text(string);
          textLength = testText.node().clientWidth;
        }

        d.wrappedLabel = string;
      }

      points.forEach(wrap);

      testText.remove();
    }

    /* Functions for handling dimredplot events and updates */
    function updateStates(influencedComponent, selectedComponent, variablesAreInfluenced) {
      var max = 0,
        dataIsSelected = false,
        stateKey;

      // Points that are selected are not influenced and influenced points need their influence to be reset
      _.forEach(d.influences, function (states, component) {
        _.forEach(states, function (val, key) {
          /*jslint unparam:true*/
          d.influences[component][key] = 0;
        });
      });

      // If points are influenced then they are not selected
      _.forEach(d.selections[influencedComponent], function (val, key) {
        /*jslint unparam:true*/
        d.selections[influencedComponent][key] = list.selected.NONE;
      });

      d.data.processedData.forEach(function (row) {
        var colName,
          influencedName,
          selectedName;

        if (variablesAreInfluenced === false || d.selections[selectedComponent][row.name] !== list.selected.NONE) {
          for (colName in row) {
            if (row.hasOwnProperty(colName)) {
              if (variablesAreInfluenced) {
                influencedName = colName;
                selectedName = row.name;
              } else {
                influencedName = row.name;
                selectedName = colName;
              }

              if (d.selections[selectedComponent][selectedName] !== list.selected.NONE && colName !== "name") {
                dataIsSelected = true;
                d.influences[influencedComponent][influencedName] += row[colName];
                max = Math.max(max, d.influences[influencedComponent][influencedName]);
              }
            }
          }
        }
      });

      if (!dataIsSelected) {
        return;
      }

      // Influence lies between 0 and 1
      for (stateKey in d.influences[influencedComponent]) {
        if (d.influences[influencedComponent].hasOwnProperty(stateKey)) {
          d.influences[influencedComponent][stateKey] /= max;
        }
      }
    }

    d.changeVariableSelection = function (method, variableSelection) {
      var variablesSelected = false,
        stateKey,
        globalSelection;

      d.selections.variable = variableSelection;

      for (stateKey in d.selections.variable) {
        if (d.selections.variable.hasOwnProperty(stateKey) && d.selections.variable[stateKey] !== list.selected.NONE) {
          variablesSelected = true;
          break;
        }
      }

      updateStates("individual", "variable", false);

      if (variablesSelected) {
        $rootScope.$broadcast("DimRedPlot::influenceAdded", d.influences.individual);
      } else {
        $rootScope.$broadcast("DimRedPlot::influenceRemoved");
      }

      globalSelection = ParCoords.selectedVariables;
      _.forEach(d.selections.variable, function (selection, variableName) {
        var currentVarPosition = _.findIndex(globalSelection, {"name": variableName});

        if (selection === list.selected.NONE) {
          if (currentVarPosition !== -1) {
            globalSelection.splice(currentVarPosition, 1);
          }
          return;
        }
        if (currentVarPosition !== -1) {
          return;
        }

        globalSelection.push(ParCoords.variables[_.findIndex(ParCoords.variables, {"name": variableName})]);
      });

      ParCoords.updateSelectedVariables(globalSelection);
    };

    d.changeIndividualSelection = function (method, individualSelection) {
      /*jslint unparam:true*/
      d.selections.individual = individualSelection;

      // BAR selection indicates a selection by ParCoords. Those selections are now removed.
      _.forEach(d.selections.individual, function (val, key) {
        if (val === list.selected.BAR) {
          d.selections.individual[key] = list.selected.NONE;
        } else if (val === list.selected.BOTH) {
          d.selections.individual[key] = list.selected.POINT;
        }
      });

      updateStates("variable", "individual", true);

      var brushed = DataSet.data().filter(function (row) {
        return d.selections.individual[row.row] !== list.selected.NONE;
      });

      $rootScope.$broadcast("DimRedPlot::brushed", brushed);
    };

    $rootScope.$on("ParCoords::brushed", function (ev, rows) {
      /*jslint unparam: true*/
      if (d.data === null) {
        return;
      }

      _.forEach(d.selections.individual, function (val, key) {
        d.selections.individual[key] = list.selected.NONE;
      });

      rows.forEach(function (row) {
        d.selections.individual[row.row] = list.selected.BAR;
      });

      updateStates("variable", "individual", true);

      $rootScope.$broadcast("DimRedPlot::selectionUpdated");
    });

    function updatePlot(data) {
      d.data = data;
      resetStates();

      d.data.analyses.forEach(function (analysis) {
        if (analysis.variableProjections !== undefined) {
          createWrappedLabels(analysis.variableProjections);
        }
        if (analysis.individualProjections !== undefined) {
          if (analysis.individualProjections.length > 1000) {
            analysis.individualProjections = undefined;
          } else {
            createWrappedLabels(analysis.individualProjections);
          }
        }
      });

      $rootScope.$broadcast("DimRedPlot::dataLoaded");
    }

    $rootScope.$on("Analytics::dimensionalityReduced", function (ev, method, session) {
      /*jslint unparam: true */
      session.getObject(updatePlot);
    });

    return d;
  });
