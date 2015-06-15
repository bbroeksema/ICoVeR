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

      // This adds a property that determines whether the variable is analysable in the R backend. This is necessary
      // because some variables are only calculated in the Javascript.
      _.forEach(d.backend.schema, function (variable) {
        variable.analysable = true;
      });

      d.backend.schemaIndex = _.indexBy(schema, 'name');
      $rootScope.$broadcast("DataSet::schemaLoaded", schema);
    }

    // Initialize the application as soon as the Dataset service is initialized and receive
    // the required information to configure and further bootstrap the front end.
    OpenCPU.json("app.init", {timestamp: Date.now()}, function (session, cfg) {
      d.data = cfg.data;
      updateSchema(cfg.data.schema);
      $rootScope.$broadcast("App::configurationLoaded", cfg);
    });

    $rootScope.$on("ParCoords::brushPredicateChanged", function (ev, predicate) {
      d.brushPredicate = predicate;
    });

    function addVariable(name, rows, type, group, missingReplacement) {
      var variableSchema = {name: name, type: type, group: group, group_type: group, analysable: false},
        rowArray = [],
        value,
        newVariable = false;

      if (d.backend.schemaIndex[name] === undefined) {
        d.backend.schema.push(variableSchema);
        d.backend.schemaIndex[name] = variableSchema;
        newVariable = true;
      }

      d.data.full.forEach(function (datum, idx) {
        d.data.full[idx][name] = rows[datum.row];
      });
      if (d.data.filtered !== undefined) {
        d.data.filtered.forEach(function (datum, idx) {
          d.data.filtered[idx][name] = rows[datum.row];
        });
      }

      if (newVariable) {
        $rootScope.$broadcast('DataSet::schemaLoaded', d.backend.schema);
      }
      if (group === "Analytics") {
        $rootScope.$broadcast('DataSet::analyticsUpdated', variableSchema);
      }

      // Tags need to be added to the actual database
      // Preferably, R should get a function addVariable and the DataSet should not have to care what
      // the group is of the variable we want to add. This would however require some extra work in R.
      if (group === "Tags") {
        _.each(d.data.full, function (row) {
          value = rows[row.row];
          if (value === undefined) {
            value = missingReplacement;
          }

          rowArray.push(value);
        });

        OpenCPU.call("data.addTag", {timestamp: Date.now(), name: name, data: rowArray});
      }

      return variableSchema;
    }

    function removeVariable(name) {
      var variableIdx = _.findIndex(d.backend.schema, "name", name),
        group;

      if (variableIdx === -1) {
        return;
      }

      group = d.backend.schema[variableIdx].group;
      d.backend.schema.splice(variableIdx, 1);
      delete d.backend.schemaIndex[name];
      $rootScope.$broadcast('DataSet::schemaLoaded', d.backend.schema);

      if (group === "Tags") {
        OpenCPU.call("data.removeTag", {timestamp: Date.now(), name: name});
      }
    }

    $rootScope.$on('DimRedPlot::analyticsAdded', function (e, variableName, analytics) {
      var variableSchema = addVariable(variableName, analytics, "numeric", "Analytics");
      $rootScope.$broadcast("DataSet::analyticsDataAvailable", variableSchema);
    });

    $rootScope.$on('DimRedPlot::analyticsRemoved', function (e, variableName) {
      removeVariable(variableName);
    });

    // Listen to the analytics service to store the results of various
    // analytical actions.
    $rootScope.$on("Analytics::dataUpdated", function (ev, identifier) {
      if (!d.backend.schemaIndex.hasOwnProperty(identifier)) {
        // We send the current timestamp as arg to avoid caching to happen here
        OpenCPU.json("data.schema", {timestamp: Date.now()}, function (session, schema) {
          updateSchema(schema);
          $rootScope.$broadcast("DataSet::analyticsUpdated", d.backend.schemaIndex[identifier]);
        });
      } else {
        $rootScope.$broadcast("DataSet::analyticsUpdated", d.backend.schemaIndex[identifier]);
      }
    });

    function processReceivedData(data) {
      d.data.filtered = undefined; // Reset filtered data.

      if (d.data.full === undefined) {
        d.data.full = data;
        d.data.full.index = {};
        _.each(data, function (datum, i) {
          d.data.full.index[datum.row] = i;
        });
        $rootScope.$broadcast("DataSet::initialDataLoaded");
      } else {
        // For each item we retrieved
        _.each(data, function (datum) {
          // If the item doesn't exist yet in the full data set, we'll have to
          // add it.
          if (d.data.full.index[datum.row] === undefined) {
            d.data.full.index[datum.row] = d.data.full.length;
            d.data.full.push(datum);
          }

          // Update the item in the full data set.
          var index = d.data.full.index[datum.row],
            dataItem = d.data.full[index],
            keys = _.keys(datum);

          _.each(keys, function (key) {
            dataItem[key] = datum[key];
          });

          d.data.full[index] = dataItem; // Not sure if this is required
        });
      }
    }

    function dataFiltered() {
      return d.backend.rows !== undefined && d.backend.rows.length > 0;
    }

    function filterData() {
      if (!dataFiltered) { throw "Trying to filter unfiltered data."; }

      var filtered = d.data.filtered || [];

      // Recreate the filtered set of rows
      _.each(d.backend.rows, function (row) {
        var index = d.data.full.index[row];
        filtered.push(d.data.full[index]);
      });
      return filtered;
    }

    function currentDataSet() {
      if (dataFiltered()) {
        if (!d.data.filtered) { d.data.filtered = filterData(); }
        return d.data.filtered.slice();
      }

      if (d.data !== undefined && d.data.full !== undefined) {
        return d.data.full.slice();
      }
      return [];
    }

    function changeBrushed(rows, method) {
      d.brushed = rows;
      $rootScope.$broadcast("DataSet::brushed", rows, method);
    }

    return {
      FilterMethod: { KEEP: 'KEEP', REMOVE: 'REMOVE', RESET: 'RESET' },

      /**
       * Returns the row ids of the currently filtered rows or undefined if no
       * filtering was applied (meaning all rows will loaded when using get).
       */
      rows: function () {
        return d.backend.rows;
      },

      /**
       * Returns the full data set as it is currently loaded, this takes filtering into account.
       */
      data: currentDataSet,

      schema: function () {
        return d.backend.schema.slice();
      },

      brushed: function () {
        if (d.brushed === undefined) {
          return [];
        }
        return d.brushed;
      },

      addVariable: addVariable,

      removeVariable: removeVariable,

      // Returns the data values for given variables.
      // @param variables - a list of strings, containing the names of the
      //                    variables to be loaded.
      // @param callback -  a function to be executed once data has been successfully loaded
      get: function (variables, callback) {
        var args = {},
          availableVariables;

        // TODO: Create a unique id for each requests. When a new request comes
        //       in, check if there is an ongoing requests which encompasses all
        //       variables in the new request. If so, add the callback to the
        //       list of callbacks for this request. Otherwise, remove already
        //       requested variables from the list (they will come in with the
        //       ongoing request) and place a new request with the remaining
        //       variables. The callback is called only when the remaining
        //       variables are loaded.
        // @see _.uniqueId
        if (d.data.full !== undefined && d.data.full.length > 0) {
          availableVariables = _.keys(d.data.full[0]);
          variables = _.difference(variables, availableVariables);
        }

        if (variables.length > 0) {
          args.variables = variables;
          // Always get the full column to avoid synchronization problems
          // related to filtering
          //args.rows = d.backend.rows;

          OpenCPU.json("data.get", args, function (session, data) {
            processReceivedData(data);
            callback(currentDataSet());
          });
        } else {
          // All variables are alread there, just directly return the data.
          callback(currentDataSet());
        }
      },

      filter: function (filterMethod) {
        if (filterMethod === this.FilterMethod.RESET) {
          d.backend.rows = undefined;
          $rootScope.$broadcast("DataSet::filtered", currentDataSet());
          return;
        }

        if (d.brushed.length === 0) { throw "ERROR, filtering while nothing is brushed"; }

        if (filterMethod === this.FilterMethod.KEEP) {
          d.backend.rows = _.pluck(d.brushed, "row");
        } else {
          var toRemove = _.indexBy(_.pluck(d.brushed, "row"));

          d.backend.rows = d.backend.rows || _.pluck(d.data.full, "row");
          d.backend.rows = _.filter(d.backend.rows, function (d) {
            return toRemove[d] === undefined;
          });
        }

        changeBrushed([], "filter");
        d.data.filtered = undefined;
        $rootScope.$broadcast("DataSet::filtered", currentDataSet());
      },

      filtered: function () {
        return d.backend.rows && d.backend.rows.length > 0;
      },

      brush: changeBrushed
    };

  });
