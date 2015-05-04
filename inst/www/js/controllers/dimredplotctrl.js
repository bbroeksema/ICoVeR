/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, list, d3, ocpu, _, $*/

angular.module('contigBinningApp.controllers')
  .controller('DimRedPlotCtrl', function ($scope, $rootScope, $element, $window, ParCoords) {
    'use strict';
    /*jslint unparam:true*/

    var dimredplot = [],
      data,
      selections = {
        variable: {},
        individual: {}
      },
      influences = {
        variable: {},
        individual: {}
      };

    /* Functions for preparing the PCA/CA/MCA analysis data */
    function resetStates() {
      selections.variable = {};
      selections.individual = {};
      influences.variable = {};
      influences.individual = {};

      data.processedData.forEach(function (row) {
        selections.individual[row.name] = list.selected.NONE;
        influences.individual[row.name] = 0;
      });

      var colName;

      if (data.processedData.length === 0) {
        return;
      }

      for (colName in data.processedData[0]) {
        if (data.processedData[0].hasOwnProperty(colName)) {
          selections.variable[colName] = list.selected.NONE;
          influences.variable[colName] = 0;
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
      _.forEach(influences, function (states, component) {
        _.forEach(states, function (val, key) {
          /*jslint unparam:true*/
          influences[component][key] = 0;
        });
      });

      // If points are influenced then they are not selected
      _.forEach(selections[influencedComponent], function (val, key) {
        /*jslint unparam:true*/
        selections[influencedComponent][key] = list.selected.NONE;
      });

      data.processedData.forEach(function (row) {
        var colName,
          influencedName,
          selectedName;

        if (variablesAreInfluenced === false || selections[selectedComponent][row.name] !== list.selected.NONE) {
          for (colName in row) {
            if (row.hasOwnProperty(colName)) {
              if (variablesAreInfluenced) {
                influencedName = colName;
                selectedName = row.name;
              } else {
                influencedName = row.name;
                selectedName = colName;
              }

              if (selections[selectedComponent][selectedName] !== list.selected.NONE && colName !== "name") {
                dataIsSelected = true;
                influences[influencedComponent][influencedName] += row[colName];
                max = Math.max(max, influences[influencedComponent][influencedName]);
              }
            }
          }
        }
      });

      if (!dataIsSelected) {
        return;
      }

      // Influence lies between 0 and 1
      for (stateKey in influences[influencedComponent]) {
        if (influences[influencedComponent].hasOwnProperty(stateKey)) {
          influences[influencedComponent][stateKey] /= max;
        }
      }
    }

    function changeSelection(drp) {
      /*jslint unparam:true*/
      data.flags.pointsChanged = false;

      d3.select($element[0]).selectAll("div.dimredplot")
        .data(data.analyses)
        .each(function (d, i) {
          /*jslint unparam:true*/
          dimredplot[i](d3.select(this));
        });
    }

    function changeVariableSelection(drp) {
      var buttonDisabled = "disabled",
        stateKey,
        colours = {},
        globalSelection;

      selections.variable = drp.variableSelections();

      for (stateKey in selections.variable) {
        if (selections.variable.hasOwnProperty(stateKey) && selections.variable[stateKey] !== list.selected.NONE) {
          buttonDisabled = null;
          break;
        }
      }

      d3.select("button#changeParcoordsVariables")
        .attr("disabled", buttonDisabled);

      updateStates("individual", "variable", false);

      dimredplot.forEach(function (d) {
        if (d !== drp) {
          d.variableSelections(selections.variable);
        }
        d.individualInfluences(influences.individual);
      });

      _.forEach(influences.individual, function (val, key) {
        colours[key] = d3.interpolateLab("steelblue", "red")(val);
      });

      $rootScope.$broadcast("Colors::changed", colours);

      globalSelection = ParCoords.selectedVariables;
      _.forEach(selections.variable, function (selection, variableName) {
        if (selection === list.selected.NONE || _.findIndex(globalSelection, {"name": variableName}) !== -1) {
          return;
        }

        globalSelection.push(ParCoords.variables[_.findIndex(ParCoords.variables, {"name": variableName})]);
      });

      ParCoords.updateSelectedVariables(globalSelection);

      changeSelection(drp);
    }

    function changeIndividualSelection(drp) {
      selections.individual = drp.individualSelections();
      updateStates("variable", "individual", true);

      dimredplot.forEach(function (d) {
        if (d !== drp) {
          d.individualSelections(selections.individual);
        }
        d.variableInfluences(influences.variable);
      });

      changeSelection(drp);
    }

    d3.select("button#changeParcoordsVariables")
      .on("click", function () {
        var selectedVariables = {},
          stateKey;

        for (stateKey in selections.variable) {
          if (selections.variable.hasOwnProperty(stateKey) && selections.variable[stateKey] !== list.selected.NONE) {
            selectedVariables[stateKey] = selections.variable[stateKey];
          }
        }
      });



    function resize() {
      d3.select($element[0]).selectAll("div.dimredplot")
        .style("width", 100 / dimredplot.length + "%")
        .style("height", "100%")
        .each(function (d, i) {
          /*jslint unparam:true*/
          dimredplot[i]
            .width($element[0].clientWidth / dimredplot.length)
            .height($element[0].clientHeight);
          dimredplot[i](d3.select(this));
        });
    }

    function updatePlot(dimRedData) {
      var div;

      dimredplot = [];
      data = dimRedData;
      data.flags = {pointsChanged: true};
      resetStates();

      data.analyses.forEach(function (analysis) {
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

      data.analyses.forEach(function () {
        var chart = list.DimRedPlot();
        chart
          .originSize(30)
          .originVisible(true)
          .on("changeVariableSelection", changeVariableSelection)
          .on("changeIndividualSelection", changeIndividualSelection)
          .individualSelections(selections.individual)
          .variableSelections(selections.variable)
          .individualInfluences(influences.individual)
          .variableInfluences(influences.variable);
        dimredplot.push(chart);
      });

      div = d3.select($element[0]).selectAll("div.dimredplot").data(data.analyses);
      div.enter()
        .append("div")
        .attr("class", "dimredplot");

      resize();

      div.exit().remove();
    }

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);


    $scope.$on("DataSet::brushed", function (ev, rows) {
      /*jslint unparam: true*/
      rows.forEach(function (row) {
        selections.individual[row.row] = list.selected.BAR;
      });

      updateStates("variable", "individual", true);

      dimredplot.forEach(function (d) {
        d.individualSelections(selections.individual);
        d.variableInfluences(influences.variable);
      });

      changeSelection(dimredplot[0]);
    });

    $scope.$on("Analytics::dimensionalityReduced", function (ev, method, session) {
      /*jslint unparam: true */
      session.getObject(updatePlot);
    });
  });
