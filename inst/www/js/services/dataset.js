'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http) {
    var dataUrl = '/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true';

    return {
      data: [],
      schema: {},
      brushed: [],

      brush: function(brushed) {
        this.brushed = brushed;
        $rootScope.$broadcast("Data::brushed")
      },

      load: function() {
        var me = this;
        var request = $http({method: 'GET', url: dataUrl});
        request.success(function(data, status, headers, config) {
          me.data = data.data;
          me.schema = data.schema;
          $rootScope.$broadcast("Data::loaded")
        });
        request.error(function(data, status, headers, config) {
          console.log("Loading failed");
          // TODO: Implement proper error handling.
          //$rootScope.$broadcast("Data::loadingFailed");
        });
      }
    };
  });
