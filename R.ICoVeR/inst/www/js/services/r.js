/*jslint white: false, indent: 2 */
/*global angular */

angular.module('contigBinningApp.services')
  .service('R', function () {

    'use strict';

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
