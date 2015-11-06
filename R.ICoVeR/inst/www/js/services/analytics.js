/*jslint todo:true, nomen: true, indent: 2 */
/*global angular, ocpu, _ */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

angular.module('contigBinningApp.services')
  .service('Analytics', function ($rootScope, DataSet) {

    'use strict';

    var d = {
      clusterMethods: [],
      dimRedMethods: []
    };

    /*jslint unparam: true */
    $rootScope.$on("App::configurationLoaded", function (ev, appConfig) {
      d.clusterMethods = _.reduce(_.keys(appConfig.cluster), function (methods, method) {
        methods.push({ name: method, args: appConfig.cluster[method] });
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::clusterMethodsAvailable", d.clusterMethods);

      d.dimRedMethods = _.reduce(_.keys(appConfig.dimred), function (methods, method) {
        var cfg = appConfig.dimred[method];
        cfg.name = method;
        methods.push(cfg);
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::dimRedMethodsAvailable", d.dimRedMethods);
    });
    /*jslint unparam: false */

    return {
      clusterMethods: function () {
        return d.clusterMethods;
      },

      dimRedMethods: function () {
        return d.dimRedMethods;
      },

      cluster: function (method, variables, args, id) {
        var fnArgs = {
          vars: variables,
          identifier: id
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }
        _.each(_.keys(args), function (key) {
          fnArgs[key] = args[key];
        });

        ocpu.call("cluster." + method, fnArgs, function () {
          $rootScope.$broadcast("Analytics::dataUpdated", id);
        });
      },

      reduce: function (method, variables) {
        var fnArgs = {
          vars: variables
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }

        ocpu.call("dimred." + method, fnArgs, function (session) {
          $rootScope.$broadcast("Analytics::dimensionalityReduced", method, session);
        });
      }
    };

  });
