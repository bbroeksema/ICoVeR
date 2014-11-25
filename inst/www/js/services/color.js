/*jslint indent: 2, white: false */
/*global angular */

'use strict';

angular.module('contigBinningApp.services')
  .service('Color', function ($rootScope, DataSet, OpenCPU) {

    /*jslint unparam: true */
    OpenCPU.json("color.configurations", {}, function (session, config) {
      $rootScope.$broadcast("Colors::configurationLoaded", config);
    });
    /*jslint unparam: false */

    return {
      color: function (variable, method, scheme) {
        var args = {
          variable: variable,
          method: method,
          scheme: scheme
        };

        if (DataSet.rows()) {
          args.rows = DataSet.rows();
        }

        /*jslint unparam: true */
        OpenCPU.json("color.apply", args, function (session, colors) {
          $rootScope.$broadcast("Colors::changed", colors);
        });
        /*jslint unparam: false */
      },
      opacity: function (value) {
        $rootScope.$broadcast("Opacity::changed", value);
      }
    };
  });
