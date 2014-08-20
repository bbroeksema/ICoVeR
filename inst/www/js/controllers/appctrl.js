'use strict';

angular.module('contigBinningApp.controllers')
  .controller('AppCtrl', function(DataSet) {

    // Trigger an initial fetch. This should be moved somewhere else, a
    // top-level controller. Putting it in the PC controller is a bit arbitrary.
    DataSet.load();

  });
