'use strict';

angular.module('contigBinningApp.services')
  .service('R', function($rootScope, $http) {
    return {
      is: {
        factor: function(typestr) {
          return typestr === "factor";
        },
        numeric: function(typestr) {
          return typestr === "numeric" || typestr === "integer";
        }
      }
    };
  });
