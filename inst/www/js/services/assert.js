/*jslint todo:true, unparam: true, nomen: true, indent: 2 */
/*global angular */

'use strict';

angular.module('contigBinningApp.services')
  .service('assert', function () {

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
