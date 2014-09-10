'use strict';

angular.module('contigBinningApp.services')
  .service('Analytics', function($rootScope, $http, DataSet, OpenCPU) {

    var d = {
      clusterMethods: []
    };

    OpenCPU.json("cluster.methods", {}, function(session, response) {
      d.clusterMethods = _.reduce(_.keys(response), function(methods, method) {
        methods.push({ name: method, args: response[method] });
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::clusterMethodsAvailable", d.clusterMethods);
    });


    return {
      clusterMethods: function() {
        return d.clusterMethods;
      },

      cluster: function(method, variables, args) {
        var fnArgs = {
          vars: variables
        }
        if (DataSet.backendData()) {
          fnArgs.data = DataSet.backendData();
        }
        // TODO: process args

        ocpu.call("cluster." + method, fnArgs, function(session) {
          console.log(session);
        });
        // TODO: Store results... somehow...
      },

      project: function() {
        // Trigger dimensionality reduction and store results... somehow...
      }
    }

  });
