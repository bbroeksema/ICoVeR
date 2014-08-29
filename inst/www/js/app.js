//ocpu.seturl("/ocpu/library/RParcoords/R");

// Create empty modules, which will be populated once the deps are loaded.
angular.module('contigBinningApp.controllers', ['ui.bootstrap']);
angular.module('contigBinningApp.services', []);

// Create a module for the application with the dependencies specified.
angular.module('contigBinningApp', [
  'contigBinningApp.controllers',
  'contigBinningApp.services',
]);

$(document).ready(function() {
    $('.multiselect').multiselect({
        buttonClass: 'btn btn-default btn-sm'
    });
});
