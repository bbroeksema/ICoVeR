/*jslint indent: 2, nomen: true */
/*global angular, _*/

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.

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
  .controller('ManualColoringCtrl', function ($scope, Color) {

    'use strict';

    $scope.colors = [];
    $scope.manualColoringEnabled = false;

    $scope.itemsBrushed = false;

    $scope.$on("Colors::changed", function () {
      if (Color.colorVariable() === "Manual selection") {
        if (!$scope.manualColoringEnabled || $scope.colors !== Color.colorScheme()) { // Manual selection is already on
          $scope.manualColoringEnabled = true;
          $scope.colors = Color.colorScheme();
        }
      } else {
        $scope.manualColoringEnabled = false;
      }
    });

    $scope.colorSelection = function (color) {
      Color.colorBrushed(color);
    };

    $scope.$on("DataSet::brushed", function (e, rows) {
      /*jslint unparam:true*/
      $scope.itemsBrushed = rows.length > 0;
    });
  });
