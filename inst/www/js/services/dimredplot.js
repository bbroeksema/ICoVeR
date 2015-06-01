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
      if (_.keys(d.processedData).length === 0) {
        return;
      }

      _.forEach(d.processedData, function (data) {
        /*jslint unparam:true*/
        _.forEach(data, function (row) {
          d.selections.individual[row.name] = list.selected.NONE;
          d.influences.individual[row.name] = 0;
          d.selectedMeans.individual[row.name] = 0;
          d.totalMeans.individual[row.name] = 0;
          d.notSelectedMeans.individual[row.name] = 0;
        });

        _.forEach(data[0], function (value, variable) {
          d.selections.variable[variable] = list.selected.NONE;
          d.influences.variable[variable] = 0;
        });
      });
    }

    /* Functions for handling dimredplot events and updates */
    function updateStates(influencedComponent, selectedComponent, variablesAreInfluenced) {
      var max = 0,
        dataIsSelected = false,
        stateKey;

      // influenced points need their influence to be reset
      _.forEach(d.influences[influencedComponent], function (val, key) {
        /*jslint unparam:true*/
        d.influences[influencedComponent][key] = 0;
      });

      // If points are influenced then they are not selected
      _.forEach(d.selections[influencedComponent], function (val, key) {
        /*jslint unparam:true*/
        d.selections[influencedComponent][key] = list.selected.NONE;
      });

      _.forEach(d.processedData, function (data) {
        _.forEach(data, function (row) {
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

    function updateMCAvariableMetrics() {
      var selectedCount = {},
        nonSelectedCount = {},
        totalCount = {},
        avgInfluence = {},
        catCount = {};

      if (d.processedData.mca === undefined) {
        return;
      }

      _.forEach(d.processedData.mca, function (row) {
        var selected = d.selections.individual[row.name];

        _.forEach(row, function (value, variable) {
          if (nonSelectedCount[variable] === undefined) {
            nonSelectedCount[variable] = 0;
            selectedCount[variable] = 0;
            totalCount[variable] = 0;
          }

          totalCount[variable] += value;

          if (selected === list.selected.NONE) {
            nonSelectedCount[variable] += value;
          } else {
            selectedCount[variable] += value;
          }
        });
      });

      _.forEach(selectedCount, function (count, variable) {
        /*jslint unparam:true*/
        d.influences.variable[variable] = Math.abs(nonSelectedCount[variable] / totalCount[variable] - selectedCount[variable] / totalCount[variable]);

        var catVariableName = variableName(variable);
        if (avgInfluence[catVariableName] === undefined) {
          avgInfluence[catVariableName] = 0;
          catCount[catVariableName] = 0;
        }

        avgInfluence[catVariableName] += d.influences.variable[variable];
        catCount[catVariableName] += 1;
      });

      _.forEach(selectedCount, function (count, variable) {
        /*jslint unparam:true*/
        var catVariableName = variableName(variable);

        d.influences.variable[variable] = avgInfluence[catVariableName] / catCount[catVariableName];
      });
    }

    function updatePCAvariableMetrics() {
      var selectedMeans = {},
        selectedCount = 0,
        nonSelectedMeans = {},
        numOfRows = 0;

      /*jslint unparam:true*/
      _.forEach(["pca", "ca"], function (method) {
        if (d.processedData[method] === undefined) {
          return;
        }

        numOfRows = d.processedData[method].length;

        _.forEach(d.processedData[method], function (row) {
          var selected = d.selections.individual[row.name];

          if (selected !== list.selected.NONE) {
            selectedCount += 1;
          }

          _.forEach(row, function (value, variable) {
            if (nonSelectedMeans[variable] === undefined) {
              nonSelectedMeans[variable] = 0;
              selectedMeans[variable] = 0;
            }

            if (selected === list.selected.NONE) {
              nonSelectedMeans[variable] += value;
            } else {
              selectedMeans[variable] += value;
            }
          });
        });
      });

      _.forEach(selectedMeans, function (mean, variable) {
        /*jslint unparam:true*/
        if (selectedCount !== 0) {
          selectedMeans[variable] /= selectedCount;
        }
        if (numOfRows !== selectedCount) {
          nonSelectedMeans[variable] /= (d.processedData.pca.length - selectedCount);
        }
        d.influences.variable[variable] = Math.abs(selectedMeans[variable] - nonSelectedMeans[variable]);
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
        d.processedData[method] = processedData;
      } else {
        _.forEach(processedData, function (row, rowIdx) {
          _.forEach(row, function (value, variable) {
            d.processedData[method][rowIdx][variable] = value;
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
        nonSelectedVariables = [],
        selectedVariables = [],
        variableSelectedPairs = [];

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

      updateStates("variable", "individual", true);
      updatePCAvariableMetrics();
      updateMCAvariableMetrics();

      $rootScope.$broadcast("DimRedPlot::selectionUpdated", method);
    });

    return d;
  });
