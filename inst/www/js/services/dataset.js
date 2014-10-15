'use strict';

/*global angular, _, ocpu*/
/*jslint todo:true, unparam: true*/

angular.module('contigBinningApp.services')
  .service('DataSet', function($rootScope, $http, OpenCPU) {
    var constants = {
      GT_ANALYTICS: "Analytics",
      G_CLUSTERINGS: "Clusterings",
      G_SUMMARIES: "Summaries"
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
          summaries: {}
        }
      }
    };

    // Initialize the schema as soon as the Dataset service is initialized.
    OpenCPU.json("data.schema", null, function(session, schema) {
      d.backend.schema = schema;
      d.backend.schemaIndex = _.indexBy(schema, 'name');
      $rootScope.$broadcast("DataSet::schemaLoaded", schema);
    });

    // Listen to the analytics service to store the results of various
    // analytical actions.
    $rootScope.$on("Analytics::dataClustered", function(ev, method, session) {
      d.backend.analytics.clusterings[method] = session;

      var vars = _.filter(d.backend.schema, function(variable) {
        return variable["group.type"] === constants.GT_ANALYTICS
          && variable.group === constants.G_CLUSTERINGS
          && variable.name === method;
      });

      if (vars.length === 0) {
        // Add it to the schema and send out notification of schema change
        var variable = {
          "group.type": constants.GT_ANALYTICS,
          "group": constants.G_CLUSTERINGS,
          "name": method,
          "type": "factor"
        };
        d.backend.schema.push(variable);
        d.backend.schemaIndex = _.indexBy(d.backend.schema, 'name');
        // TODO: This should problably change into DataSet::schemaChanged to
        //       avoid the parallel coordinates component redrawing itself.
        $rootScope.$broadcast("DataSet::schemaLoaded", d.backend.schema);
      } // else nothing to do.
    });

    $rootScope.$on("Analytics::variablesSummarized", function(ev, variableContributions, session) {
      function sum(array) {
        return _.reduce(array, function(a, b) { return a + b; }, 0);
      }

      var summaryName = _.chain(variableContributions)
        .map(function(contribs, variable) {
          return { variable: variable, contrib: sum(contribs) };
        })
        .sortBy('contrib')
        .reverse()
        .first(2)
        .pluck('variable')
        .join('-')
        .value();

      // Prepend a distinghuising string, so that we don't inadvertly replace
      // one of the existing variables.
      summaryName = "smry-" + summaryName;

      // TODO: When different clustering levels, result in clusters where the
      //       two most important variables are the same, this will result in an
      //       earlier calculated summary being replaced.
      d.backend.analytics.summaries[summaryName] = session;
      if (!d.backend.schemaIndex.hasOwnProperty(summaryName)) {
        var variable = {
          "group.type": constants.GT_ANALYTICS,
          "group": constants.G_SUMMARIES,
          "name": summaryName,
          "type": "numeric"
        };
        d.backend.schema.push(variable);
        d.backend.schemaIndex = _.indexBy(d.backend.schema, "name");
      }
      $rootScope.$broadcast("DataSet::schemaLoaded", d.backend.schema);
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

      // Returns the data values for given variables.
      // @param variables - a list of strings, containing the names of the 
      //                    variables to be loaded.
      get: function(variables) {
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
          _.each(_.keys(data[0]), function(variable) {
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
            _.each(varsData, function(dataItem, index) {
              _.extend(dataItem, data[index]);
            });
          }

          // Verify if we're done loading'
          if (_.every(variables, loaded)) {
            $rootScope.$broadcast("DataSet::dataLoaded", varsData);
          }
        }

        // Now the actual processing of the request...

        // First, we mark all requested variables as unloaded and split the
        // requested variables in the appropriate groups. Because, we cannot
        // get all of them straightforward from the backend.
        _.each(variables, function(name) {
          varsLoaded[name] = false;

          var variable = schemaIndex[name];
          switch(variable.group) {
            case constants.G_CLUSTERINGS:
              varsByGroup.clustervars.push(variable);
              break;
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
        OpenCPU.json("data.get", args, function(session, data) {
          dataReceived(data);
        });

        // For each of the performed clustering methods, trigger an http get to
        // retrieve the cluster values from their respective ocpu sessions.
        var clusterings = d.backend.analytics.clusterings;
        var methods = _.keys(clusterings);
        _.each(methods, function(method) {
          var session = clusterings[method];
          $http({ method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true" })
            .success(function(data) {
              // This is a row, cluster map. E.g.:
              // { 1: 14, 2: 14, 3: 2, etc}
              //
              // Remember, the rows come from R and R indexes start at 1!
              //
              // Below we transform this map into the format (when method is
              // kmeans):
              // [ { row: 1, kmeans: 14}, {row: 2, kmeans: 14}, etc]
              var values = _.map(_.keys(data), function(key) {
                var value = { row: key };
                value[method] = data[key];
                return value;
              });
              dataReceived(values);
            }); // (data, status, headers, config)
        });

        // For each of the requested summaries, trigger an http get to retrieve
        // the summary values from their respective ocpu sessions.
        var smryVariables = _.pluck(varsByGroup.summaryvars);
        _.each(smryVariables, function(smryVariable) {
          var session = d.backend.analytics.summaries[smryVariable.name];
          $http({ method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true" })
            .success(function(data) { // (data, status, headers, config)
              // This is a row, summary map. E.g.:
              // { 1: 14, 2: 14, 3: 2, etc}
              //
              // Remember, the rows come from R and R indexes start at 1!
              //
              // [ { row: 1, smry-aaaa-aaat: 0.023}, {row: 2, smry-aaaa-aaat: 1.2401}, etc]
              var values = _.map(_.keys(data), function(key) {
                var value = { row: key };
                value[smryVariable.name] = data[key];
                return value;
              });
              dataReceived(values);
            });
        });


        // TODO: Implement dr methods in the backend
        // TODO: retrieve and merge results, similar as with clustering results.
        // TODO: The parcoords component listens to DataSet::dataLoaded. We 
        //       might want to skip showing rows in the scatterplot at first
        //       and focus on columns first, until we figured out a good way
        //       to deal with this.
      },

      // TODO: filter will not work at the moment when analytical variables are
      //       included.
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
