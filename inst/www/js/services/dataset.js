/*jslint todo:true, nomen: true, white: false, indent: 2, unparam: true */
/*global angular, _, ocpu*/

angular.module('contigBinningApp.services')
  .service('DataSet', function ($rootScope, $http, assert, OpenCPU) {

    'use strict';

    var d = {
        id: undefined,
        data: undefined,
        brushed: [],
        backend: {
          schema: undefined,
          schemaIndex: undefined,
          rows: undefined,
          analytics: {
            clusterings: {},
            summaries: {}
          }
        }
      };

    function updateSchema(schema) {
      d.backend.schema = schema;
      d.backend.schemaIndex = _.indexBy(schema, 'name');
      $rootScope.$broadcast("DataSet::schemaLoaded", schema);
    }

    // Initialize the application as soon as the Dataset service is initialized and receive
    // the required information to configure and further bootstrap the front end.
    OpenCPU.json("app.init", null, function (session, cfg) {
      d.data = cfg.data;
      updateSchema(cfg.data.schema);
      $rootScope.$broadcast("App::configurationLoaded", cfg);
    });

    $rootScope.$on("ParCoords::brushPredicateChanged", function (ev, predicate) {
      d.brushPredicate = predicate;
    });

    // Listen to the analytics service to store the results of various
    // analytical actions.
    $rootScope.$on("Analytics::dataUpdated", function (ev, identifier) {
      if (!d.backend.schemaIndex.hasOwnProperty(identifier)) {
        OpenCPU.json("data.schema", null, function (session, schema) {
          updateSchema(schema);
          $rootScope.$broadcast("DataSet::analyticsDataAvailable", d.backend.schemaIndex[identifier]);
        });
      } else {
        $rootScope.$broadcast("DataSet::analyticsDataAvailable", d.backend.schemaIndex[identifier]);
      }
    });

    return {
      FilterMethod: { KEEP: 'KEEP', REMOVE: 'REMOVE', RESET: 'RESET' },

      /**
       * Returns the row ids of the currently filtered rows or undefined if no
       * filtering was applied (meaning all rows will loaded when using get).
       */
      rows: function () {
        return d.backend.rows;
      },

      // Returns the data values for given variables.
      // @param variables - a list of strings, containing the names of the
      //                    variables to be loaded.
      // @param callback -  a function to be executed once data has been successfully loaded
      get: function (variables, callback) {
        var args = {
          variables: variables,
          rows: d.backend.rows
        };

        if (args.variables.length > 0) {
          OpenCPU.json("data.get", args, function (session, data) {
            callback(data);
          });
        }
      },

      filter: function (filterMethod) {
        if (filterMethod === this.FilterMethod.RESET) {
          d.backend.rows = undefined;
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
          return;
        }

        if (d.brushed.length === 0) { throw "ERROR, filtering while nothing is brushed"; }

        if (filterMethod === this.FilterMethod.KEEP) {
          d.backend.rows = _.pluck(d.brushed, "row");
        } else {
          var toRemove = _.indexBy(_.pluck(d.brushed, "row")),
            rowCount = d.data.dimensions.rows;

          d.backend.rows = d.backend.rows || Array.apply(null, { length: rowCount }).map(Number.call, Number);
          d.backend.rows = _.filter(d.backend.rows, function (d) {
            return toRemove[d] === undefined;
          });
        }

        d.brushed = [];
        $rootScope.$broadcast("DataSet::filtered", filterMethod);
      },

      brush: function (rows) {
        d.brushed = rows;
        $rootScope.$broadcast("DataSet::brushed", rows);
      }

    };

  });
