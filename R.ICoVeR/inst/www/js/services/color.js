/*jslint indent: 2, white: false, nomen: true */
/*global angular, _, d3 */

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
  .service('Color', function ($rootScope, DataSet, R) {

    'use strict';

    var d = {
        dataSchema: undefined,
        coloring: {
          schemeName: undefined,
          scheme: undefined,
          method: undefined,
          colorFn: undefined,
          variable: undefined
        },
        schemes: {
          numeric: {
            value: {
              blue_to_brown: ["steelblue", "brown"],
              blue_to_yellow: ["blue", "yellow"],
              cool: ["#00FFFF", "magenta"]
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
              "category C (20 colors)": d3.scale.category20c().range(),
              "red_yellow_blue (11 colors)": d3.colorbrewer.RdYlBu[11]
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
          colored = {};

        d.coloring.colorFn = d3.scale.ordinal();
        d.coloring.colorFn
          .domain(domain)
          .range(d.schemes.factor.value[colorScheme]);

        _.each(data, function (datum) {
          colored[datum.row] = d.coloring.colorFn(datum[colorVariable]);
        });

        d.coloring.scheme = d.schemes.factor.value[colorScheme];
        $rootScope.$broadcast("Colors::changed", colored);
      });
    }

    function colorNumericValue(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var domain = d3.extent(data, function (datum) { return datum[colorVariable]; }),
          colored = {};

        d.coloring.colorFn = d3.scale.linear();
        d.coloring.colorFn
          .domain(domain)
          .range(d.schemes.numeric.value[colorScheme])
          .interpolate(d3.interpolateLab);

        _.each(data, function (datum) {
          colored[datum.row] = d.coloring.colorFn(datum[colorVariable]);
        });

        d.coloring.scheme = d.schemes.numeric.value[colorScheme];
        $rootScope.$broadcast("Colors::changed", colored);
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

        d.coloring.colorFn = function (value) {
          var bin = 0;

          _.each(colorStepValues, function (stepValue) {
            if (value > stepValue) {
              bin += 1;
            } else {
              return;
            }
          });

          return colorScheme[bin];
        };

        d.coloring.scheme = d.schemes.numeric.decile[colorScheme];
        $rootScope.$broadcast("Colors::changed", colored);
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

    function colorManual(colorScheme) {
      var data = DataSet.data(),
        rowColors = {};

      d.coloring.colorFn = function () {
        return "steelblue";
      };

      _.forEach(data, function (row) {
        rowColors[row.row] = "steelblue";
      });
      d.coloring.scheme = d.schemes.factor.value[colorScheme];

      DataSet.addVariable("Manual selection", rowColors, "factor", "Colors", "steelblue");

      $rootScope.$broadcast("Colors::changed", rowColors);
    }

    function color(variable, colorMethod, colorScheme) {
      var type = variableType(variable);
      d.coloring.variable = variable;
      d.coloring.method = colorMethod;
      d.coloring.schemeName = colorScheme;

      if (R.is.factor(type)) {
        if (variable === "Manual selection") {
          colorManual(colorScheme);
        } else {
          colorFactor(variable, colorMethod, colorScheme);
        }
      } else if (R.is.numeric(type)) {
        colorNumeric(variable, colorMethod, colorScheme);
      } else {
        throw type + " is an unsupported data type";
      }
    }

    /*jslint unparam: true */
    $rootScope.$on("DataSet::schemaLoaded", function (ev, schema) {
      d.dataSchema = schema;
    });
    /*jslint unparam: false */

    $rootScope.$on('DataSet::analyticsUpdated', function (e, analyticsSchema) {
      /*jslint unparam:true*/
      if (analyticsSchema.type !== "numeric" && d.coloring.variable === undefined) {
        return; // We do not want automatic colouring on clustering
      }

      if (d.coloring.variable === undefined) {
        d.coloring.method = "Value";
        d.coloring.schemeName = "blue_to_brown";
      }

      if (d.coloring.variable === undefined || d.coloring.variable === analyticsSchema.name) {

        color(analyticsSchema.name, d.coloring.method, d.coloring.schemeName);
      }
    });

    $rootScope.$on("DataSet::initialDataLoaded", function () {
      DataSet.addVariable("Manual selection", {}, "factor", "Colors", "steelblue");
    });

    return {
      configuration: function () {
        return cfg;
      },

      color: color,

      colorScheme: function () {
        return d.coloring.scheme;
      },

      colorSchemeName: function () {
        return d.coloring.schemeName;
      },

      colorMethod: function () {
        return d.coloring.method;
      },

      colorFn: function () {
        return d.coloring.colorFn;
      },

      colorVariable: function () {
        return d.coloring.variable;
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

        d.coloring.variable = "Manual selection";
        d.coloring.colorFn = function (colorVal) {
          return colorVal; // The values of this variable are actually colors
        };

        DataSet.addVariable("Manual selection", rowColors, "factor", "Colors", "steelblue");

        $rootScope.$broadcast("Colors::changed", rowColors);
      },

      opacity: function (value) {
        $rootScope.$broadcast("Opacity::changed", value);
      }
    };
  });
