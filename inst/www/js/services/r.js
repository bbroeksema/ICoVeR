'use strict';

angular.module('contigBinningApp.services')
  .service('R', function($rootScope, $http) {
    return {
      is: {
        numeric: function(typestr) {
          return typestr === "numeric" || typestr === "integer";
        }
      }
    };
  });
