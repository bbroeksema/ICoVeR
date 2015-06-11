/*jslint white: false, indent: 2, nomen: true */
/*global angular, ocpu, _ */

angular.module('contigBinningApp.services')
  .service('OpenCPU', function ($http) {

    'use strict';

    // For testing without having to re-install the R-plugin over and over again
    // enable the following line, adjust the path, and run:
    // rparcoords/inst/www $ python -m SimpleHTTPServer
    ocpu.seturl("//localhost/ocpu/user/bertjan/library/RParcoords/R", false);

    function asJson(callback) {
      return function (session) {
        $http({method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true"})
          .success(_.partial(callback, session));
      };
    }

    return {
      call: function (fn, args, cb) {
        ocpu.call(fn, args, cb);
      },

      json: function (fn, args, cb) {
        ocpu.call(fn, args, asJson(cb));
      }
    };
  });
