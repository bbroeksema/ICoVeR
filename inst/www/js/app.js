/*jslint indent: 2 */
/*global angular */

//ocpu.seturl("/ocpu/library/RParcoords/R");

// Create empty modules, which will be populated once the deps are loaded.
angular.module('contigBinningApp.controllers', ['ui.bootstrap']);
angular.module('contigBinningApp.services', []);

// Create a module for the application with the dependencies specified.
angular.module('contigBinningApp', [
  'contigBinningApp.controllers',
  'contigBinningApp.services'
]);
