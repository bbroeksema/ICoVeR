'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http) {
    var dataUrl = '/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true';

    var d = {
      id: undefined,
      brushExtents: [],
      data: [],
      backend: {
        data: undefined // OpenCPU Session object
      }
    }

    return {
      FilterMethod: { KEEP: 'KEEP', REMOVE: 'REMOVE' },

      filter: function(filterMethod) {
        var args = {
          extents: d.brushExtents,
          method: filterMethod
        };

        if (d.backend.data !== undefined) {
          args.data = d.backend.data;
        }

        ocpu.call("filterByExtents", args, retrieveResult);

        function retrieveResult(session) {
          d.backend.data = session; // Keep track of the current state.
          $http({method: 'GET', url: session.loc + "R/.val/json"})
            .success(function(response) {
              $rootScope.$broadcast("DataSet::filtered", response);
            });
        }
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
