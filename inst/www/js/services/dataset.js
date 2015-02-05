/*jslint todo:true, nomen: true, white: false, indent: 2, unparam: true */
/*global angular, _, ocpu*/

angular.module('contigBinningApp.services')
  .service('DataSet', function ($rootScope, $http, assert, OpenCPU) {

    'use strict';

    var constants = {
        GT_ANALYTICS: "Analytics",
        G_CLUSTERINGS: "Clusterings",
        G_SUMMARIES: "Summaries"
      },
      d = {
        id: undefined,
        brushExtents: {},
        brushPredicate: undefined,
        backend: {
          schema: undefined,
          schemaIndex: undefined,
          rows: undefined,
          analytics: {
            clusterings: {},
            summaries: {}
          }
        }
      },
      currentNumRowsCallback = null; // if defined is sued as a callback so a controller can
                                     // be updated witht he current numebr of row of data

    // Initialize the application as soon as the Dataset service is initialized and receive
    // the required information to configure and further bootstrap the front end.
    OpenCPU.json("app.init", null, function (session, cfg) {
      d.backend.schema = cfg.schema;
      d.backend.schemaIndex = _.indexBy(cfg.schema, 'name');
      $rootScope.$broadcast("DataSet::schemaLoaded", cfg.schema);
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
          d.backend.schema = schema;
          d.backend.schemaIndex = _.indexBy(schema, 'name');
          $rootScope.$broadcast("DataSet::schemaLoaded", schema);
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
        var args = {},
          schemaIndex = d.backend.schemaIndex,
          varsByGroup = { clustervars: [], datavars: [], summaryvars: [] },
          varsLoaded = {},
          varsData;

        // Some helper functions we need for processing the get request.
        function loaded(name) {
          return varsLoaded[name];
        }

        // When we retrieve requested data, we have to update the variables
        // that have been loaded, and we need to merge the already loaded
        // data with the data we just received.
        function dataReceived(data) {
          // Mark the currently retrieved variables as loaded.
          _.each(_.keys(data[0]), function (variable) {
            varsLoaded[variable] = true;
          });

          // Merge the currently loaded variabels with the ones already loaded.
          if (varsData === undefined) {
            varsData = data;
          } else {
            // TODO: verify that the cluster results are in the same order, for
            //       now I assume this (and think they actually are). Otherwise
            //       they can be merged using the row attribute on objects in
            //       both arrays.
            _.each(varsData, function (dataItem, index) {
              _.extend(dataItem, data[index]);
            });
          }

          // Verify if we're done loading'
          if (_.every(variables, loaded)) {
            if (currentNumRowsCallback) {
              currentNumRowsCallback(data.length);
            }
            callback(varsData);
          }
        }

        // Now the actual processing of the request...

        // First, we mark all requested variables as unloaded and split the
        // requested variables in the appropriate groups. Because, we cannot
        // get all of them straightforward from the backend.
        _.each(variables, function (name) {
          varsLoaded[name] = false;

          var variable = schemaIndex[name];
          switch (variable.group) {
          case constants.G_SUMMARIES:
            varsByGroup.summaryvars.push(variable);
            break;
          // TODO:
          // case constants.G_DIMRED:
          //   varsByGroup.dimredvars.push(variable);
          //   break;
          default:
            varsByGroup.datavars.push(variable);
            break;
          }
        });

        // Get the data variables from the backend.
        args.variables = _.pluck(varsByGroup.datavars, "name");
        args.rows = d.backend.rows;
        // Request data from back end, but only
        // if there are non dnamic / clustering variables
        // being requested
        if (args.variables.length > 0) {
          OpenCPU.json("data.get", args, function (session, data) {
            dataReceived(data);
          });
        }

        // TODO: Implement dr methods in the backend
        // TODO: retrieve and merge results, similar as with clustering results.
        // TODO: The parcoords component listens to DataSet::dataLoaded. We
        //       might want to skip showing rows in the scatterplot at first
        //       and focus on columns first, until we figured out a good way
        //       to deal with this.
      },

      // TODO: filter will not work at the moment when analytical variables are
      //       included.
      filter: function (filterMethod) {
        if (filterMethod === this.FilterMethod.RESET) {
          d.backend.rows = undefined;
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
          return;
        }

        var me = this,
          args = {
            extents: d.brushExtents.extents,
            categories: d.brushExtents.categories,
            predicate: d.brushPredicate,
            method: filterMethod
          };

        if (d.backend.rows !== undefined) {
          args.rows = d.backend.rows;
        }

        ocpu.call("data.filter", args, function (session) {
          d.backend.rows = session; // Keep track of the current state.
          me.brush({ extents: {}, categories: {} });
          $rootScope.$broadcast("DataSet::filtered", filterMethod);
        });
      },

      brush: function (extents, rows) {
        assert.strictEqual(typeof extents.extents, "object", "Expected an extents property");
        assert.strictEqual(typeof extents.categories, "object", "Expected an categories property");

        d.brushExtents = extents;
        $rootScope.$broadcast("DataSet::brushed", d.brushExtents, rows);
      },

      // Returns the totalumber of rows in the dataset
      getTotalNumRows: function (callback) {
        OpenCPU.json("data.gettotalnumrows", {}, function (session, returnedNumberOfRows) {
          callback(returnedNumberOfRows);
        });
      },

      //Set callback function for updating the current data set size
      setCurrentNumRowsCallback: function (callback) {
        currentNumRowsCallback = callback;
      }

    };

  });
