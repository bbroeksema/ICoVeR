/*jslint white: false, indent: 2, nomen: true */
/*global angular, _, list, d3, ocpu */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

angular.module('contigBinningApp.services')
  .service('DimRedPlot', function ($rootScope, DataSet, Analytics) {

    'use strict';

    var d = {
      dimRedMethods: [],
      analyses: [],
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

    // Makes sure that the labels of points are no longer than 80px
    function createWrappedLabels(points) {
      var testText = d3.select("body").append("div").style("float", "left");

      testText.style("font-size", "8px");

      function wrap(d, i) {
        /*jslint unparam:true*/
        var textLength,
            string,
            desiredStringLength,
            label = d.id;

        if (d.label !== undefined) {
          label = d.label;
        }

        testText.text(label);
        textLength = testText.node().offsetWidth;

        string = label;
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

    function processDimRedResults(variables) {
      return function (data) {  
        var index;

        d.addProcessedData(data.method[0], data.processedData);

        if (data.variableProjections !== undefined) {
          createWrappedLabels(data.variableProjections);
        }
        if (data.individualProjections !== undefined) {
          createWrappedLabels(data.individualProjections);
        }
        
        // Add a list of variables for automatic redoing of dim. red.
        data.usedVariables = variables;
        
        index = _.findIndex(d.analyses, {'method': data.method});

        if (index === -1) {
          data.plotIdx = d.analyses.length;
          d.analyses.push(data);
        } else {
          data.plotIdx = index;
          d.analyses[index] = data;
        }
        
        $rootScope.$broadcast("DimRedPlot::dimensionalityReduced", data);
      };
    }

    $rootScope.$on("App::configurationLoaded", function (ev, appConfig) {
      /*jslint unparam: true */
      d.dimRedMethods = _.reduce(_.keys(appConfig.dimred), function (methods, method) {
        var cfg = appConfig.dimred[method];
        cfg.name = method;
        methods.push(cfg);
        return methods;
      }, []);
      $rootScope.$broadcast("DimRedPlot::dimRedMethodsAvailable", d.dimRedMethods);
    });

    d.reduce = function (method, variables) {
      var fnArgs = {
        vars: variables
      };
      if (DataSet.rows()) {
        fnArgs.rows = DataSet.rows();
      }

      ocpu.call("dimred." + method, fnArgs, function (session) {
        session.getObject(processDimRedResults(variables));
      });
    };

    $rootScope.$on('DataSet::filtered', function () {
      d.analyses.forEach(function (analysis) {
        d.reduce(analysis.method[0], analysis.usedVariables);
      });
    });

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
        DataSet.addVariable("influence", d.influences.individual, "numeric", "Analytics");
      } else {
        DataSet.removeVariable("influence");
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
      if (_.findIndex(d.dimRedMethods, "name", method) === -1) {
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
