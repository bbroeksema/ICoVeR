/*jslint todo:true, unparam: true, nomen: true, indent: 2 */
/*global angular */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.

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
  .service('assert', function () {

    'use strict';

    return {
      strictEqual: function (actual, expected, message) {
        var sEqual = (actual === expected),
          msg = "Expected strict equality";

        msg += (message !== undefined) ? ": " + message : "";
        if (!sEqual) { throw new Error(msg); }
      },

      notStrictEqual: function (actual, expected, message) {
        var sNotEqual = (actual !== expected),
          msg = "Expected strict unequality";

        msg += (message !== undefined) ? ": " + message : "";
        if (!sNotEqual) { throw new Error(msg); }
      }
    };
  });
