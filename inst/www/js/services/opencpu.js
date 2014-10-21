/*jslint white: false, indent: 2, nomen: true */
/*global angular, ocpu, _ */

'use strict';

angular.module('contigBinningApp.services')
  .service('OpenCPU', function ($http) {

    function asJson(callback) {
      return function (session) {
        $http({method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true"})
          .success(_.partial(callback, session));
      };
    }

    return {

      json: function (fn, args, cb) {
        ocpu.call(fn, args, asJson(cb));
      }
    };
  });
