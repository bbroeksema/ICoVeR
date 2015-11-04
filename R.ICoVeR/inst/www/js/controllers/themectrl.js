/*jslint indent: 2 */
/*global angular, $ */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

angular.module('contigBinningApp.controllers')
  .controller('ThemeCtrl', function ($scope, ParCoords) {

    'use strict';

    var link = $('#maincss');

    $scope.theme = 'light';
    $scope.$watch('theme', function (newTheme) {
      var url = 'css/' + newTheme + '.css';
      if (link.attr('href') !== url) {
        link.attr('href', url);
      }

      ParCoords.changeTheme(newTheme);
    });
  });
