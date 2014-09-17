'use strict';

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http, OpenCPU) {
    var constants = {
      GT_ANALYTICS: "Analytics",
      G_CLUSTERINGS: "clusterings"
    };
    var d = {
      id: undefined,
      brushExtents: {},
      backend: {
        schema: undefined,
        schemaIndex: undefined,
        rows: undefined,
        analytics: {
          clusterings: {},
        }
      }
    };

    // Initialize the schema as soon as the Dataset service is initialized.
    OpenCPU.json("data.schema", null, notifySchemaLoad);

    function notifySchemaLoad(session, schema) {
      d.backend.schema = schema;
      d.backend.schemaIndex = _.indexBy(schema, 'name');
      $rootScope.$broadcast("DataSet::schemaLoaded", schema);
    }

    // Listen to the analytics service to store the results of various
    // analytical actions.
    $rootScope.$on("Analytics::dataClustered", function(ev, method, session) {
      d.backend.analytics.clusterings[method] = session;

      var vars = _.filter(d.backend.schema, function(variable) {
        return variable["group.type"] === constants.GT_ANALYTICS
          && variable["group"] === constants.G_CLUSTERINGS
          && variable["name"] === method;
      });

      if (vars.length === 0) {
        // Add it to the schema and send out notification of schema change
        var variable = {
          "group.type": constants.GT_ANALYTICS,
          "group": constants.G_CLUSTERINGS,
          "name": method,
          "type": "factor"
        }
        d.backend.schema.push(variable);
        d.backend.schemaIndex = _.indexBy(d.backend.schema, 'name');
        // TODO: This should problably change into DataSet::schemaChanged to
        //       avoid the parallel coordinates component redrawing itself.
        $rootScope.$broadcast("DataSet::schemaLoaded", d.backend.schema);
      } // else nothing to do.
    });

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

      brush: function(extents, rows) {
        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents, rows);
      }
    };
  });
