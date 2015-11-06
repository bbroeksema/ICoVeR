/*jslint white: false, indent: 2, nomen: true */
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
  .service('OpenCPU', function ($http) {

    'use strict';

    // For testing without having to re-install the R-plugin over and over again
    // enable the following line, adjust the path, and run:
    // rparcoords/inst/www $ python -m SimpleHTTPServer
    //
    // NOTE: Make sure that this line is disabled when you run gulp to generate
    //       the minimized version!
    //ocpu.seturl("//localhost/ocpu/user/bertjan/library/ICoVeR/R", false);

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
