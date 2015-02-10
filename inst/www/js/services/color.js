/*jslint indent: 2, white: false, nomen: true */
/*global angular, _ */

angular.module('contigBinningApp.services')
  .service('Color', function ($rootScope, DataSet, OpenCPU) {

    'use strict';

    var p = {
        schemes: {
          numeric: {
            value: {
              blue_to_brown: ["steelblue", "brown"]
            },
            decile: {
              // We need 10 values here, so we manually add one. They where obtained as
              // follows (in a browser): d3.rgb(X).darker().toString(), where X is the
              // last color returned by each particular color pallette.
              yellow_to_green: [], // c(brewer.pal(9, "YlGn"), "#00301C"),
              yellow_to_red: [], // c(brewer.pal(9, "YlOrRd"), "#59001a"),
              blue_to_green: [], // c(brewer.pal(9, "BuGn"), "#002F12"),
              blue_to_purple: [], // c(brewer.pal(9, "BuPu"), "#350034"),
              blues: [] // c(brewer.pal(9, "Blues"), "#05214A")
            }
          },
          factor: {
            value: {
              accent: [], //brewer.pal(8, "Accent"),
              dark2: [], //brewer.pal(8, "Dark2"),
              paired: [], //brewer.pal(12, "Paired"),
              pastel1: [], //brewer.pal(9, "Pastel1"),
              pastel2: [], //brewer.pal(8, "Pastel2"),
              set1: [], //brewer.pal(9, "Set1"),
              set2: [], //brewer.pal(8, "Set2"),
              set3: [], //brewer.pal(12, "Set3"),
              // the qualitiative set will calulate the number of clusters before application
              qualitative_set: [] //rainbow_hcl(30, c = 50, l = 70, start = 0, end = 360*(30-1)/30)
            }
          }
        }
      },
      cfg = {
        numeric: {
          Value: _.keys(p.schemes.numeric.value),
          Decile: _.keys(p.schemes.numeric.decile)
          //"Z-score" = c("RedToBlue", "Spectral")
        },
        factor: {
          Value: _.keys(p.schemes.factor.value)
        }
      };

    return {
      configuration: function () {
        return cfg;
      },

      color: function (variable, method, scheme) {
        var args = {
          variable: variable,
          method: method,
          scheme: scheme
        };

        if (DataSet.rows()) {
          args.rows = DataSet.rows();
        }

        /*jslint unparam: true */
        OpenCPU.json("color.apply", args, function (session, colors) {
          $rootScope.$broadcast("Colors::changed", colors);
        });
        /*jslint unparam: false */
      },
      opacity: function (value) {
        $rootScope.$broadcast("Opacity::changed", value);
      }
    };
  });
