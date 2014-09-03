'use strict';

angular.module('contigBinningApp.services')
  .service('Color', function($rootScope, R, DataSet) {

    var d = {

      scales: {
        blue_to_brown: d3.scale.linear()
          .range(["steelblue", "brown"])
          .interpolate(d3.interpolateLab)
      },

      methods: {
        value: function(variable) {
          var domain = d3.extent(variable),
              scale = d.scales.blue_to_brown.domain(domain),
              colors = _.map(variable, scale);

          $rootScope.$broadcast("Colors::changed", colors);
        },

        decile: function(variable) {

        },

        Zscore: function(variable) {

        }
      }
    }

    return {
      methods: function(type) {
        return R.is.numeric(type) ? ["value", "decile", "Z-score"] : [];
      },

      color: function(variable, method) {
        if (!_.contains(this.methods(variable.type), method)) {
          throw("Invalid method: " + method + " for variable: " + variable.name + "(" +
                variable.type + ")");
        }
        DataSet.get(variable.name, function(session, variable) {
          d.methods.value(variable);
        });

      }
    }

  });
