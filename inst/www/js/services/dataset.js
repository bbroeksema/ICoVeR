'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http) {
    var dataUrl = '/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true';

    var d = {
      id: undefined,
      brushExtents: [],
      data: []
    }

    return {

      brush: function(brushed) {
        this.brushed = brushed;
        $rootScope.$broadcast("Data::brushed")
      },

      load: function() {
        var request = $http({method: 'GET', url: dataUrl});
        request.success(function(response, status, headers, config) {
          d.id = response.id;
          d.data = response.data;
          $rootScope.$broadcast("DataSet::loaded", response.schema, response.data);
        });
        request.error(function(data, status, headers, config) {
          console.log("Loading failed");
          // TODO: Implement proper error handling.
          //$rootScope.$broadcast("Data::loadingFailed");
        });
      }
    };
  });
