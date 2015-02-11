/*jslint indent: 2, white: false, nomen: true */
/*global angular, _, d3 */

angular.module('contigBinningApp.services')
  .service('Color', function ($rootScope, DataSet, R) {

    'use strict';

    var d = {
        dataSchema: undefined,
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

        $rootScope.$broadcast("Colors::changed", colored);
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

        $rootScope.$broadcast("Colors::changed", colored);
      });
    }

    function colorNumericDecile(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var color = d3.scale.quantile(),
          domain = d3.extent(data, function (datum) { return datum[colorVariable]; }),
          colored = {};

        colorScheme = d.schemes.numeric.decile[colorScheme];
        color
          .domain(domain)
          .range(_.range(0, 10));

        _.each(data, function (datum) {
          colored[datum.row] = colorScheme[color(datum[colorVariable])];
        });

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

    /*jslint unparam: true */
    $rootScope.$on("DataSet::schemaLoaded", function (ev, schema) {
      d.dataSchema = schema;
    });
    /*jslint unparam: false */

    return {
      configuration: function () {
        return cfg;
      },

      color: function (variable, colorMethod, colorScheme) {
        var type = variableType(variable);
        if (R.is.factor(type)) {
          colorFactor(variable, colorMethod, colorScheme);
        } else if (R.is.numeric(type)) {
          colorNumeric(variable, colorMethod, colorScheme);
        } else {
          throw "Unsoppoerted data type";
        }
      },

      opacity: function (value) {
        $rootScope.$broadcast("Opacity::changed", value);
      }
    };
  });
