'use strict';

angular.module('contigBinningApp.services')
  .service('Analytics', function($rootScope, $http, DataSet, OpenCPU) {

    var d = {
      clusterMethods: [],
      dimRedMethods: []
    };

    OpenCPU.json("cluster.methods", {}, function(session, response) {
      d.clusterMethods = _.reduce(_.keys(response), function(methods, method) {
        methods.push({ name: method, args: response[method] });
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::clusterMethodsAvailable", d.clusterMethods);
    });

    OpenCPU.json("dimred.methods", {}, function(session, response) {
      d.dimRedMethods = _.reduce(_.keys(response), function(methods, method) {
        var cfg = response[method];
        cfg.name = method;
        methods.push(cfg);
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::dimRedMethodsAvailable", d.dimRedMethods);
    });


    return {
      clusterMethods: function() {
        return d.clusterMethods;
      },

      cluster: function(method, variables, args) {
        var fnArgs = {
          vars: variables
        }
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }
        // TODO: process args

        ocpu.call("cluster." + method, fnArgs, function(session) {
          $rootScope.$broadcast("Analytics::dataClustered", method, session);
        });
      },

      reduce: function(method, variables) {
        var fnArgs = {
          vars: variables
        }
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }

        ocpu.call("dimred." + method, fnArgs, function(session) {
          $rootScope.$broadcast("Analytics::dimensionalityReduced", method, session);
        });
      }
    }

  });
