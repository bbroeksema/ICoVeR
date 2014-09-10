'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http, OpenCPU) {

    var d = {
      id: undefined,
      brushExtents: {},
      backend: {
        schema: undefined,
        rows: undefined
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

      /**
       * Returns the row ids of the currently filtered rows or undefined if no
       * filtering was applied (meaning all rows will loaded when using get).
       */
      rows: function() {
        return d.backend.rows;
      },

      get: function(variables) {
        var args = {
          variables: variables
        };
        if (d.backend.rows !== undefined) {
          args.rows = d.backend.rows;
        }
        OpenCPU.json("data.get", args, function(session, data) {
          $rootScope.$broadcast("DataSet::dataLoaded", data);
        });
      },

      filter: function(filterMethod) {
        if (filterMethod === this.FilterMethod.RESET) {
          d.backend.rows = undefined;
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
          return;
        }

        var args = {
          extents: d.brushExtents,
          method: filterMethod
        };
        if (d.backend.rows !== undefined) {
          args.rows = d.backend.rows;
        }

        var me = this;
        ocpu.call("data.filter", args, function(session) {
          d.backend.rows = session; // Keep track of the current state.
          me.brush({});
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
        });
      },

      brush: function(extents) {
        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents);
      }
    };
  });
