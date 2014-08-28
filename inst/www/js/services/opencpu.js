'use strict';

angular.module('contigBinningApp.services')
  .service('OpenCPU', function($rootScope, $http) {

    function asJson(callback) {
      return function(session) {
        $http({method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true"})
          .success(_.partial(callback, session));
      };
    }

    return {

      json: function(fn, args, cb) {
        ocpu.call(fn, args, asJson(cb));
      }
    }
  });
