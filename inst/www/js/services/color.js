/*jslint indent: 2, white: false, nomen: true */
/*global angular, _, d3 */

angular.module('contigBinningApp.services')
  .service('Color', function ($rootScope, DataSet, R) {

    'use strict';

    var d = {
        dataSchema: undefined,
        currentColorScheme: undefined,
        schemes: {
          numeric: {
            value: {
              blue_to_brown: ["steelblue", "brown"]
            },
            decile: {
              yellow_to_red: d3.colorbrewer.YlOrRd[10],
              yellow_to_green: d3.colorbrewer.YlGn[10],
              blue_to_green: d3.colorbrewer.BuGn[10],
              blue_to_purple: d3.colorbrewer.BuPu[10],
              blues: d3.colorbrewer.Blues[10]
            }
          },
          factor: {
            value: {
              "paired (12 colors)": d3.colorbrewer.Paired[12],
              "set3 (12 colors)": d3.colorbrewer.Set3[12],
              "category A (20 colors)": d3.scale.category20().range(),
              "category B (20 colors)": d3.scale.category20b().range(),
              "category C (20 colors)": d3.scale.category20c().range()
              // the qualitiative set will calulate the number of clusters before application
              // qualitative_set: [] //rainbow_hcl(30, c = 50, l = 70, start = 0, end = 360*(30-1)/30)
            }
          }
        }
      },
      cfg = {
        numeric: {
          Value: _.keys(d.schemes.numeric.value),
          Decile: _.keys(d.schemes.numeric.decile)
          //"Z-score" = c("RedToBlue", "Spectral")
        },
        factor: {
          Value: _.keys(d.schemes.factor.value)
        }
      };

    function variableType(variable) {
      return _.result(_.find(d.dataSchema, { name: variable }), 'type');
    }

    function colorFactorValue(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var domain = _.pluck(_.uniq(data, colorVariable), colorVariable),
          color = d3.scale.ordinal(),
          colored = {};

        color
          .domain(domain)
          .range(d.schemes.factor.value[colorScheme]);

        _.each(data, function (datum) {
          colored[datum.row] = color(datum[colorVariable]);
        });

        d.currentColorScheme = d.schemes.factor.value[colorScheme];
        $rootScope.$broadcast("Colors::changed", colored, color, colorVariable);
      });
    }

    function colorNumericValue(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var color = d3.scale.linear(),
          domain = d3.extent(data, function (datum) { return datum[colorVariable]; }),
          colored = {};

        color
          .domain(domain)
          .range(d.schemes.numeric.value[colorScheme])
          .interpolate(d3.interpolateLab);

        _.each(data, function (datum) {
          colored[datum.row] = color(datum[colorVariable]);
        });

        d.currentColorScheme = d.schemes.numeric.value[colorScheme];
        $rootScope.$broadcast("Colors::changed", colored, color, colorVariable);
      });
    }

    // Puts 10 percent of the data items, ordered by color variabel in the same
    // bin.
    function colorNumericDecile(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var colored = {},
          binSize = Math.round(data.length / 10),
          currentBin = 0,
          currentBinSize = 0,
          lastValue,
          colorStepValues = [];

        data.sort(function (a, b) {
          return +a[colorVariable] - +b[colorVariable];
        });

        colorScheme = d.schemes.numeric.decile[colorScheme];

        _.each(data, function (row) {
          var value = row[colorVariable];

          if (currentBinSize >= binSize && currentBin < 9 && value !== lastValue) {
            currentBin = currentBin + 1;
            currentBinSize = 0;

            colorStepValues.push((value + lastValue) / 2);
          }

          currentBinSize = currentBinSize + 1;
          lastValue = value;

          colored[row.row] = colorScheme[currentBin];
        });

        function colorFunction(value) {
          var bin = 0;

          _.each(colorStepValues, function (stepValue) {
            if (value > stepValue) {
              bin += 1;
            } else {
              return;
            }
          });

          return colorScheme[bin];
        }

        d.currentColorScheme = d.schemes.numeric.decile[colorScheme];
        $rootScope.$broadcast("Colors::changed", colored, colorFunction, colorVariable);
      });
    }

    function colorNumeric(colorVariable, colorMethod, colorScheme) {
      switch (colorMethod) {
      case "Value":
        colorNumericValue(colorVariable, colorScheme);
        break;
      case "Decile":
        colorNumericDecile(colorVariable, colorScheme);
        break;
      case "Z-score":
        break;
      default:
        throw "Unsupported color method:" + colorMethod;
      }
    }

    function colorFactor(colorVariable, colorMethod, colorScheme) {
      switch (colorMethod) {
      case "Value":
        colorFactorValue(colorVariable, colorScheme);
        break;
      default:
        throw "Unsupported color method:" + colorMethod;
      }
    }

    function colorManual(colorVariable, colorScheme) {
      var data = DataSet.data(),
        rowColors = {},
        colorFunction = function () {
          return "steelblue";
        };

      _.forEach(data, function (row) {
        rowColors[row.row] = "steelblue";
      });

      d.currentColorScheme = d.schemes.factor.value[colorScheme];

      DataSet.addVariable("Manual selection", rowColors, "factor", "Colors", "steelblue");

      $rootScope.$broadcast("Colors::changed", rowColors, colorFunction, colorVariable);
    }

    /*jslint unparam: true */
    $rootScope.$on("DataSet::schemaLoaded", function (ev, schema) {
      d.dataSchema = schema;
    });

    $rootScope.$on("DataSet::initialDataLoaded", function () {
      DataSet.addVariable("Manual selection", {}, "factor", "Colors", "steelblue");
    });
    /*jslint unparam: false */

    return {
      configuration: function () {
        return cfg;
      },

      color: function (variable, colorMethod, colorScheme) {
        var type = variableType(variable);
        if (R.is.factor(type)) {
          if (variable === "Manual selection") {
            colorManual(variable, colorScheme);
          } else {
            colorFactor(variable, colorMethod, colorScheme);
          }
        } else if (R.is.numeric(type)) {
          colorNumeric(variable, colorMethod, colorScheme);
        } else {
          throw type + " is an unsupported data type";
        }
      },

      colorScheme: function () {
        return d.currentColorScheme;
      },

      colorBrushed: function (color) {
        var rowColors = {};

        DataSet.get(["Manual selection"], function (rows) {
          _.forEach(rows, function (row) {
            rowColors[row.row] = row["Manual selection"];
          });
        });

        _.forEach(DataSet.brushed(), function (row) {
          rowColors[row.row] = color;
        });

        DataSet.addVariable("Manual selection", rowColors, "factor", "Colors", "steelblue");

        $rootScope.$broadcast("Colors::changed", rowColors, undefined, "Manual selection");
      },

      opacity: function (value) {
        $rootScope.$broadcast("Opacity::changed", value);
      }
    };
  });
