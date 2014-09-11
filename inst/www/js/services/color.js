'use strict';

angular.module('contigBinningApp.services')
  .service('Color', function($rootScope, R, DataSet, OpenCPU) {

    OpenCPU.json("color.configurations", {}, function(session, config) {
      $rootScope.$broadcast("Colors::configurationLoaded", config);
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
          $rootScope.$broadcast("Colors::changed", colors);
        });
      }
    }
  });
