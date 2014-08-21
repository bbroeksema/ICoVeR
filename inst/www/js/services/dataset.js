'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http) {
    var dataUrl = '/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true';

    var d = {
      id: undefined,
      brushExtents: {},
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

        var me = this;
        function retrieveResult(session) {
          d.backend.data = session; // Keep track of the current state.
          $http({method: 'GET', url: session.loc + "R/.val/json"})
            .success(function(response) {
              $rootScope.$broadcast("DataSet::filtered", response);
              me.brush({});
            });
        }
      },

      brush: function(extents) {
        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents);
      },

      load: function() {
        var request = $http({method: 'GET', url: dataUrl}),
            me = this;

        request.success(function(response, status, headers, config) {
          d.id = response.id;
          d.data = response.data;
          $rootScope.$broadcast("DataSet::loaded", response.schema, response.data);
          me.brush({});
        });
      }
    };
  });
