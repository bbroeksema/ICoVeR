'use strict';

angular.module('contigBinningApp.services')
  .service('Analytics', function($rootScope, $http, DataSet) {

    var d = {
      clusterMethods: []
    };

    function retrieveClusterMethods(session) {

      function processResponse(response) {
        d.clusterMethods = _.reduce(_.keys(response), function(methods, method) {
          methods.push({ name: method, args: response[method] });
          return methods;
        }, []);
        $rootScope.$broadcast("Analytics::clusterMethodsAvailable", d.clusterMethods);
      };

      function retry() {
        // Try harder, this typically shouldn't happen, but the Rstudio
        // webserver is not that much into multi threaded request handling
        // This is not a problem for installations
        if (!session.count || session.count < 3) {
          session.count = session.count ? session.count + 1 : 1;
          retrieveClusterMethods(session);
        }
      }

      $http({method: 'GET', url: session.output[0] + "/json?auto_unbox=true"})
        .success(processResponse)
        .error(retry);
    };

    ocpu.call("cluster.methods", {}, retrieveClusterMethods);


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
