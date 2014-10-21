/*jslint white: false, indent: 2 */
/*global angular */

'use strict';

angular.module('contigBinningApp.services')
  .service('R', function () {
    return {
      is: {
        factor: function (typestr) {
          return typestr === "factor";
        },
        numeric: function (typestr) {
          return typestr === "numeric" || typestr === "integer";
        }
      }
    };
  });
