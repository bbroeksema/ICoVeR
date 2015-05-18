/*jslint white: false, indent: 2, nomen: true */
/*global angular, _, list, d3 */

// This service is meant to share state betweem the parcoords visualization and
// the various control widgets

angular.module('contigBinningApp.services')
  .service('DimRedPlot', function ($rootScope, ParCoords, DataSet) {

    'use strict';

    var d = {
      processedData: null,
      selections: {
        variable: {},
        individual: {}
      },
      influences: {
        variable: {},
        individual: {}
      },
      selectedMeans: {
        individual: {}
      },
      totalMeans: {
        individual: {}
      },
      notSelectedMeans: {
        individual: {}
      },
      meanDifferences: {
        individual: {}
      }
    };

    function resetStates() {
      if (d.processedData.length === 0) {
        return;
      }

      d.processedData.forEach(function (row) {
        // Row selection should only be updated when they are not already added earlier
        if (d.selections.individual[row.name] !== undefined) {
          return;
        }

        d.selections.individual[row.name] = list.selected.NONE;
        d.influences.individual[row.name] = 0;
        d.selectedMeans.individual[row.name] = 0;
        d.totalMeans.individual[row.name] = 0;
        d.notSelectedMeans[row.name] = 0;
      });

      var colName;

      for (colName in d.processedData[0]) {
        if (d.processedData[0].hasOwnProperty(colName) && d.selections.variable[colName] === undefined) {
          d.selections.variable[colName] = list.selected.NONE;
          d.influences.variable[colName] = 0;
        }
      }
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

      d.processedData.forEach(function (row) {
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

    function variableName(variable) {
      var splitIndex = variable.indexOf(":");

      if (splitIndex !== -1) {
        return variable.substring(0, splitIndex);
      }
      return variable;
    }

    /*function updateMeans() {
      var variables = [],
        selectionCount = 0;

      _.forEach(d.selections.variable, function (val, key) {
        if (key === "name") {
          return;
        }

        variables.push(variableName(key));

        if (val !== list.selected.NONE) {
          selectionCount += 1;
        }
      });

      variables.push("row");

      DataSet.get(variables, function (data) {
        data.forEach(function (row) {
          var totalMean = 0,
            selectedMean = 0,
            notSelectedMean = 0;

          _.forEach(row, function (val, key) {
            if (d.selections.variable[key] === undefined) {
              return;
            }*/
    /*jslint todo:true*/
            //TODO: fix
            /*totalMean += val;
            if (d.selections.variable[key] === list.selected.NONE) {
              notSelectedMean += val;
            } else {
              selectedMean += val;
            }
          });

          totalMean /= variables.length - 1;
          if (selectedMean !== 0) {
            selectedMean /= selectionCount;
          }
          if (notSelectedMean !== 0) {
            notSelectedMean /= variables.length - 1 - selectionCount;
          }

          d.totalMeans.individual[row.row] = totalMean;
          d.selectedMeans.individual[row.row] = selectedMean;
          d.notSelectedMeans.individual[row.row] = notSelectedMean;
          d.meanDifferences.individual[row.row] = Math.abs(selectedMean - notSelectedMean);

        });
      });
    }*/

    d.addProcessedData = function (processedData) {
      if (d.processedData === null) {
        d.processedData = processedData;
      } else {
        processedData.forEach(function (row, rowIdx) {
          _.forEach(row, function (value, variable) {
            d.processedData[rowIdx][variable] = value;
          });
        });
      }

      resetStates();
    };

    d.selectedVariables = function () {
      var selection = [];

      _.forEach(d.selections.variable, function (selected, variable) {
        if (selected === list.selected.NONE) {
          return;
        }

        selection.push(variableName(variable));
      });

      return _.uniq(selection);
    };

    d.changeVariableSelection = function (method, variableSelection) {
      var variablesSelected = false,
        stateKey,
        globalSelection,
        selectedVariables = [];

      d.selections.variable = variableSelection;

      for (stateKey in d.selections.variable) {
        if (d.selections.variable.hasOwnProperty(stateKey) && d.selections.variable[stateKey] !== list.selected.NONE) {
          variablesSelected = true;
          break;
        }
      }

      updateStates("individual", "variable", false);
      //updateMeans();

      if (variablesSelected) {
        $rootScope.$broadcast("DimRedPlot::analyticsAdded", "influence", d.influences.individual);
        //$rootScope.$broadcast("DimRedPlot::analyticsAdded", "mean", d.selectedMeans.individual);
        //$rootScope.$broadcast("DimRedPlot::analyticsAdded", "mean_difference", d.meanDifferences.individual);
      } else {
        $rootScope.$broadcast("DimRedPlot::analyticsRemoved", "influence");
        //$rootScope.$broadcast("DimRedPlot::analyticsRemoved", "mean");
        //$rootScope.$broadcast("DimRedPlot::analyticsRemoved", "mean_difference");
      }

      /*jslint todo:true*/
      //TODO: look into this: when both a PCA and a CA plot have been made,
      //      currentVarPosition will never be -1, e.g., d.selections.variable will contain all variables.
      globalSelection = ParCoords.selectedVariables;

      _.forEach(d.selections.variable, function (selection, variable) {
        var currentVarPosition;

        variable = variableName(variable);

        currentVarPosition = _.findIndex(globalSelection, {"name": variable});

        if (selection === list.selected.NONE) {
          if (currentVarPosition !== -1) {
            globalSelection.splice(currentVarPosition, 1);
          }
          return;
        }
        if (currentVarPosition !== -1) {
          return;
        }

        selectedVariables.push(ParCoords.variables[_.findIndex(ParCoords.variables, {"name": variable})]);
      });

      // We add the variables here because when we use MCA d.selections.variable contain categories,
      // so if we add the variables in the previous loop they might be removed again by the splice.
      selectedVariables.forEach(function (variable) {
        globalSelection.push(variable);
      });

      /*jslint todo:true*/
      //TODO: change this to a broadcast, this logic should be handled by ParCoords
      if (globalSelection.length === 0) {
        ParCoords.resetSelectedVariables();
      } else {

        ParCoords.updateSelectedVariables(globalSelection);
      }

      $rootScope.$broadcast("DimRedPlot::variablesSelected", method);
    };

    d.changeIndividualSelection = function (method, individualSelection) {
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

      $rootScope.$broadcast("DimRedPlot::brushed", brushed, method);
    };

    $rootScope.$on("ParCoords::brushed", function (ev, rows) {
      /*jslint unparam: true*/
      if (d.processedData === null) {
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

    return d;
  });
