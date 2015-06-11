/*jslint todo:true, nomen: true, white: false, indent: 2, unparam: true */
/*global angular, _*/

angular.module('contigBinningApp.services')
  .service('Tag', function ($rootScope, DataSet) {

    'use strict';

    var d = {
      tags: [],
      filteredTags: []
    };



    function databaseTags(userFriendlyTags) {
      return _.map(userFriendlyTags, function (tag) {
        return "tag_" + tag;
      });
    }

    function appendTag(tag, rows) {
      DataSet.brushed().forEach(function (row) {
        rows[row.row] = 1;
      });

      DataSet.addVariable(tag, rows, "boolean", "Tags", 0);
    }

    function addTag(tag) {
      var rows = {};

      appendTag(tag, rows);
    }

    $rootScope.$on("DataSet::schemaLoaded", function (e, schema) {
      /*jslint unparam:true*/
      d.tags = _.pluck(_.filter(schema, "group_type", "Tags"), "name");

      if (d.tags.length !== 0) {
        DataSet.get(d.tags, function (data) {
          $rootScope.$broadcast("Tag::tagsLoaded");
        });
      }
    });

    return {
      // Tags are stored prefixed with tag_, which we remove here
      tags: function () {
        var tags = d.filteredTags;

        if (tags.length === 0) {
          tags = d.tags;
        }

        return _.map(tags, function (tag) {
          return tag.substring(4, tag.length);
        });
      },

      // Remove the tags that have no presence in the current filtered data
      removeNonPresentTags: function () {
        DataSet.get(d.tags, function (rows) {
          d.filteredTags = _.filter(d.tags, function (tag) {
            return _.indexOf(_.pluck(rows, tag), 1) !== -1;
          });
        });

        $rootScope.$broadcast("Tag::tagsLoaded");
      },

      // Create or overwrite an already existing tag in the database
      storeTag: function (tag) {
        addTag("tag_" + tag);

        $rootScope.$broadcast("Tag::tagsLoaded");
      },

      // Append to an existing tag in the database
      appendToTag: function (tag) {
        var tagData = {};
        tag = "tag_" + tag;

        DataSet.get([tag], function (rows) {
          _.each(rows, function (row) {
            tagData[row.row] = row[tag];
          });
        });

        appendTag(tag, tagData);
      },

      // Remove the selected tags from the database
      removeTags: function (selectedTags) {
        _.each(databaseTags(selectedTags), function (tag) {
          var index = _.indexOf(d.tags, tag);

          d.tags.splice(index, 1);
          DataSet.removeVariable(tag);
        });

        $rootScope.$broadcast("Tag::tagsLoaded");
      },

      // Brush the rows inside the selected tags
      selectTagged: function (selectedTags) {
        var brushed = [],
          tags = databaseTags(selectedTags);

        DataSet.get(tags, function (rows) {
          brushed = _.filter(rows, function (row, rowIdx) {
            /*jslint unparam:true*/
            return _.some(tags, function (tag) {
              return row[tag];
            });
          });
        });

        DataSet.brush(brushed, "tag");
      }
    };
  });
