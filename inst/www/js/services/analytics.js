/*jslint todo:true, nomen: true, indent: 2 */
/*global angular, ocpu, _ */

angular.module('contigBinningApp.services')
  .service('Analytics', function ($rootScope, DataSet) {

    'use strict';

    var d = {
      clusterMethods: [],
      dimRedMethods: []
    };

    /*jslint unparam: true */
    $rootScope.$on("App::configurationLoaded", function (ev, appConfig) {
      d.clusterMethods = _.reduce(_.keys(appConfig.cluster), function (methods, method) {
        methods.push({ name: method, args: appConfig.cluster[method] });
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::clusterMethodsAvailable", d.clusterMethods);

      d.dimRedMethods = _.reduce(_.keys(appConfig.dimred), function (methods, method) {
        var cfg = appConfig.dimred[method];
        cfg.name = method;
        methods.push(cfg);
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::dimRedMethodsAvailable", d.dimRedMethods);
    });
    /*jslint unparam: false */

    return {
      clusterMethods: function () {
        return d.clusterMethods;
      },

      cluster: function (method, variables, args, id) {
        var fnArgs = {
          vars: variables,
          identifier: id
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }
        _.each(_.keys(args), function (key) {
          fnArgs[key] = args[key];
        });

        ocpu.call("cluster." + method, fnArgs, function () {
          $rootScope.$broadcast("Analytics::dataUpdated", id);
        });
      },

      reduce: function (method, variables) {
        var fnArgs = {
          vars: variables
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }

        ocpu.call("dimred." + method, fnArgs, function (session) {
          $rootScope.$broadcast("Analytics::dimensionalityReduced", method, session);
        });
      },

      summarize: function (variableWeights) {
        var fnArgs = { variableWeights: variableWeights },
          summaryName = "";

        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }

        // creating summary columne name
        function sum(array) {
          return _.reduce(array, function (a, b) { return a + b; }, 0);
        }

        summaryName = _.chain(variableWeights)
          .map(function (contribs, variable) {
            return { variable: variable, contrib: sum(contribs) };
          })
          .sortBy('contrib')
          .reverse()
          .first(2)
          .pluck('variable')
          .join('_')
          .value();

        // Prepend a distinghuising string, so that we don't inadvertly replace
        // one of the existing variables.
        summaryName = "smry_" + summaryName;
        fnArgs.identifier = summaryName;
        ocpu.call("dimred.summarize", fnArgs, function () {
          $rootScope.$broadcast("Analytics::dataUpdated", summaryName);
        });
      }
    };

  });
