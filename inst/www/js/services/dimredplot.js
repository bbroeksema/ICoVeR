/*jslint white: false, indent: 2, nomen: true */
/*global angular, _, list, d3 */

angular.module('contigBinningApp.services')
  .service('DimRedPlot', function ($rootScope, DataSet, Analytics) {

    'use strict';

    var d = {
      processedData: {},
      selections: {
        variable: {},
        individual: {}
      },
      influences: {
        variable: {},
        individual: {}
      },
      selectedMeans: {
        individual: {},
        variable: {}
      },
      totalMeans: {
        individual: {},
        variable: {}
      },
      notSelectedMeans: {
        individual: {},
        variable: {}
      },
      meanDifferences: {
        individual: {},
        variable: {}
      }
    };

    function resetStates() {
      d.selections.individual = {};
      d.influences.individual = {};
      d.selections.variable = {};
      d.influences.variable = {};

      _.forEach(d.processedData, function (data) {
        /*jslint unparam:true*/
        _.forEach(data.rowNames, function (rowIdx, rowName) {
          d.selections.individual[rowName] = list.selected.NONE;
          d.influences.individual[rowName] = 0;
        });

        _.forEach(data.columnNames, function (varIdx, variable) {
          d.selections.variable[variable] = list.selected.NONE;
          d.influences.variable[variable] = 0;
        });
      });
    }

    function variableName(variable) {
      var splitIndex = variable.indexOf(":");

      if (splitIndex !== -1) {
        return variable.substring(0, splitIndex);
      }
      return variable;
    }

    function updateMCAvariableMetrics(processedData) {
      var selectedCount = [],
        nonSelectedCount = [],
        totalCount = [],
        avgInfluence = [],
        catCount = [],
        firstIteration = true;

      _.forEach(processedData.rowNames, function (rowIdx, rowName) {
        var selected = d.selections.individual[rowName];

        _.forEach(processedData.data[rowIdx], function (value, varIdx) {
          if (firstIteration) {
            nonSelectedCount.push(0);
            selectedCount.push(0);
            totalCount.push(0);
          }

          totalCount[varIdx] += value;

          if (selected === list.selected.NONE) {
            nonSelectedCount[varIdx] += value;
          } else {
            selectedCount[varIdx] += value;
          }
        });

        firstIteration = false;
      });

      _.forEach(processedData.columnNames, function (varIdx, variable) {
        var catVariableName = variableName(variable);

        if (avgInfluence[catVariableName] === undefined) {
          avgInfluence[catVariableName] = 0;
          catCount[catVariableName] = 0;
        }

        avgInfluence[catVariableName] += Math.abs(nonSelectedCount[varIdx] / totalCount[varIdx] - selectedCount[varIdx] / totalCount[varIdx]);
        catCount[catVariableName] += 1;
      });

      _.forEach(processedData.columnNames, function (varIdx, variable) {
        /*jslint unparam:true*/
        var catVariableName = variableName(variable);

        d.influences.variable[variable] = avgInfluence[catVariableName] / catCount[catVariableName];
      });
    }

    function updatePCAvariableMetrics(processedData) {
      var selectedMeans = [],
        selectedCount = 0,
        nonSelectedMeans = [],
        numOfRows = processedData.data.length,
        firstIteration = true;

      _.forEach(processedData.rowNames, function (rowIdx, rowName) {
        var selected = d.selections.individual[rowName];

        if (selected !== list.selected.NONE) {
          selectedCount += 1;
        }

        _.forEach(processedData.data[rowIdx], function (value, varIdx) {
          if (firstIteration) {
            nonSelectedMeans.push(0);
            selectedMeans.push(0);
          }

          if (selected === list.selected.NONE) {
            nonSelectedMeans[varIdx] += value;
          } else {
            selectedMeans[varIdx] += value;
          }
        });

        firstIteration = false;
      });

      _.forEach(processedData.columnNames, function (varIdx, variable) {
        if (selectedCount !== 0) {
          selectedMeans[varIdx] /= selectedCount;
        }
        if (numOfRows !== selectedCount) {
          nonSelectedMeans[varIdx] /= (numOfRows - selectedCount);
        }
        d.influences.variable[variable] = Math.abs(selectedMeans[varIdx] - nonSelectedMeans[varIdx]);
      });
    }

    function updateVariableMetrics() {
      _.forEach(d.processedData, function (data, method) {
        if (method === "mca") {
          updateMCAvariableMetrics(data);
        } else {
          updatePCAvariableMetrics(data); // This can do both PCA and CA
        }
      });
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

    d.addProcessedData = function (method, processedData) {
      /*jslint unparam:true*/
      if (d.processedData[method] === undefined) {
        d.processedData[method] = {
          rowNames: {},
          columnNames: {}
        };
      }

      _.forEach(processedData.rowNames, function (rowName, rowIdx) {
        d.processedData[method].rowNames[rowName] = rowIdx;
      });

      _.forEach(processedData.columnNames, function (columnName, colIdx) {
        d.processedData[method].columnNames[columnName] = colIdx;
      });

      d.processedData[method].data = processedData.data;

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
      var nonSelectedVariables = [],
        selectedVariables = [],
        variableSelectedPairs = [];

      d.selections.variable = variableSelection;

      /*for (stateKey in d.selections.variable) {
        if (d.selections.variable.hasOwnProperty(stateKey) && d.selections.variable[stateKey] !== list.selected.NONE) {
          variablesSelected = true;
          break;
        }
      }

      //updateStates("individual", "variable", false);
      //updateMeans();

      if (variablesSelected) {
        $rootScope.$broadcast("DimRedPlot::analyticsAdded", "influence", d.influences.individual);
        //$rootScope.$broadcast("DimRedPlot::analyticsAdded", "mean", d.selectedMeans.individual);
        //$rootScope.$broadcast("DimRedPlot::analyticsAdded", "mean_difference", d.meanDifferences.individual);
      } else {
        $rootScope.$broadcast("DimRedPlot::analyticsRemoved", "influence");
        //$rootScope.$broadcast("DimRedPlot::analyticsRemoved", "mean");
        //$rootScope.$broadcast("DimRedPlot::analyticsRemoved", "mean_difference");
      }*/

      _.forEach(d.selections.variable, function (selection, variable) {
        if (selection === list.selected.NONE) {
          nonSelectedVariables.push(variableName(variable));
        }
      });

      nonSelectedVariables = _.uniq(nonSelectedVariables);
      selectedVariables = d.selectedVariables();
      // We need to do this because some variables could have both selected and non-selected categories
      nonSelectedVariables = _.difference(nonSelectedVariables, selectedVariables);

      _.forEach(nonSelectedVariables, function (variable) {
        variableSelectedPairs.push({name: variable, selected: false});
      });

      _.forEach(selectedVariables, function (variable) {
        variableSelectedPairs.push({name: variable, selected: true});
      });

      $rootScope.$broadcast("DimRedPlot::variablesSelected", method, variableSelectedPairs);
    };

    d.changeIndividualSelection = function (method, individualSelection) {
      d.selections.individual = individualSelection;

      // BAR selection indicates a selection outside of dimredplot. Those selections are now removed.
      _.forEach(d.selections.individual, function (val, key) {
        if (val === list.selected.BAR) {
          d.selections.individual[key] = list.selected.NONE;
        } else if (val === list.selected.BOTH) {
          d.selections.individual[key] = list.selected.POINT;
        }
      });

      var brushed = DataSet.data().filter(function (row) {
        return d.selections.individual[row.row] !== list.selected.NONE;
      });

      DataSet.brush(brushed, method);
    };

    $rootScope.$on("DataSet::brushed", function (ev, rows, method) {
      /*jslint unparam: true*/
      if (_.keys(d.processedData).length === 0) {
        return;
      }

      // If this brushing is done outside of dimredplot we need to set the selection
      // type to BAR.
      if (_.findIndex(Analytics.dimRedMethods(), "name", method) === -1) {
        _.forEach(d.selections.individual, function (val, key) {
          d.selections.individual[key] = list.selected.NONE;
        });

        rows.forEach(function (row) {
          d.selections.individual[row.row] = list.selected.BAR;
        });
      }

      updateVariableMetrics();

      $rootScope.$broadcast("DimRedPlot::selectionUpdated", method);
    });

    return d;
  });
