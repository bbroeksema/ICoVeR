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
      FilterMethod: { KEEP: 'KEEP_BRUSHED', REMOVE: 'REMOVE_BRUSHED' },

      filter: function(filterMethod) {
        // TODO:
        // 1. Currently done at the frontend. We might want to move this to the
        //    backend.
        // 2. Keep history.
        switch(filterMethod) {
          case this.FilterMethod.KEEP:
            d.data = d.brushed;
            break;
          case this.FilterMethod.REMOVE:
            d.data = _.without(d.data, d.brushed)
            break;
        }

        $rootScope.$broadcast("DataSet::filtered", d.data);
      },

      brush: function(extents) {
        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents);
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
