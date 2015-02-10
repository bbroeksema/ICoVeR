/*jslint indent: 2 */
/*global angular, $ */

angular.module('contigBinningApp.controllers')
  .controller('ThemeCtrl', function ($scope) {

    'use strict';

    var link = $('#maincss');

    $scope.theme = 'light';
    $scope.$watch('theme', function (newTheme) {
      var url = 'css/' + newTheme + '.css';
      if (link.attr('href') !== url) {
        link.attr('href', url);
      }
    });
  });
