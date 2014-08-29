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
      FilterMethod: { KEEP: 'KEEP', REMOVE: 'REMOVE', RESET: 'RESET' },

      backendData: function() {
        return d.backend.data;
      },

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
        if (filterMethod === this.FilterMethod.RESET) {
          d.backend.data = undefined;
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
          return;
        }

        var args = {
          extents: d.brushExtents,
          method: filterMethod
        };
        if (d.backend.data !== undefined) {
          args.data = d.backend.data;
        }

        var me = this;
        ocpu.call("data.filter", args, function(session) {
          d.backend.data = session; // Keep track of the current state.
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
          me.brush({});
        });
      },

      brush: function(extents) {
        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents);
      }
    };
  });
