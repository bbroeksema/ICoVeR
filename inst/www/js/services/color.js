'use strict';

angular.module('contigBinningApp.services')
  .service('Color', function($rootScope, R, DataSet, OpenCPU) {

    var d = {






      session: undefined
    };

    OpenCPU.json("color.configurations", {}, function(session, config) {
      $rootScope.$broadcast("Colors::configurationLoaded", config);
    });
    
    $rootScope.$on("DataSet::filtered", function(ev, filterMethod) {
      var args = {};
      if (d.session !== undefined) {
        args.colors = d.session;
      }
      if (DataSet.rows() !== undefined) {
        args.rows = DataSet.rows();
      }
      
      OpenCPU.json("color.get", args, function(s, colors) {
        $rootScope.$broadcast("Colors::changed", colors);
      });
    });

    return {
      color: function(variable, method, scheme) {        
        var args = {
          variable: variable,
          method: method,
          scheme: scheme
        }
        if (DataSet.rows()) {
          args.rows = DataSet.rows();
        }
        
        OpenCPU.json("color.apply", args, function(session, colors) {
          d.session = session;
          $rootScope.$broadcast("Colors::changed", colors);
        });
      }
    }
  });
