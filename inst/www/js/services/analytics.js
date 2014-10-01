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
        methods.push({ name: method, args: response[method] });
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

      project: function() {
        // Trigger dimensionality reduction and store results... somehow...
      }
    }

  });
