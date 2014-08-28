'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http, OpenCPU) {

    var d = {
      id: undefined,
      brushExtents: {},
      schema: {},
      data: [],
      backend: { // OpenCPU Session objects
        schema: undefined,
        data: undefined
      }
    }

    // Initialize the schema as soon as the Dataset service is initialized.
    OpenCPU.json("data.schema", null, notifySchemaLoad);

    function notifySchemaLoad(session, schema) {
      d.backend.schema = schema;
      $rootScope.$broadcast("DataSet::schemaLoaded", schema);
    }

    return {
      FilterMethod: { KEEP: 'KEEP', REMOVE: 'REMOVE' },

      get: function(variables, cb) {
        var args = {
          variables: variables
        };
        if (d.backend.data !== undefined) {
          args.data = d.backend.data;
        }

        OpenCPU.json("data.get", args, cb);
      },

      filter: function(filterMethod) {
        var args = {
          extents: d.brushExtents,
          method: filterMethod
        };
        if (d.backend.data !== undefined) {
          args.data = d.backend.data;
        }

        var me = this;
        OpenCPU.json("data.filter", args, function(session, data) {
          d.backend.data = session; // Keep track of the current state.
          $rootScope.$broadcast("DataSet::filtered", data);
          me.brush({});
        });
      },

      brush: function(extents) {
        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents);
      }
    };
  });
