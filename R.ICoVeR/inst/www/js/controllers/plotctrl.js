/*jslint indent: 2, nomen: true */
/*global angular, _, d3 */

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
  .controller('PlotCtrl', function ($scope, DimRedPlot) {

    'use strict';

    $scope.analyses = [];

    $scope.dimredplotWidth = "col-lg-12";

    $scope.hideOptions = false;

    $scope.sliding = {"left": 0};

    function switchOptions() {
      if ($scope.hideOptions) {
        $scope.sliding = {"transform": "translate(0,0)"};
        $scope.hideOptions = false;
      } else {
        $scope.sliding = {"transform": "translate(-90%, 0)"};
        $scope.hideOptions = true;
      }
    }

    $scope.switchOptions = function () {
      switchOptions();
    };

    $scope.$on("DimRedPlot::dimensionalityReduced", function () {
      $scope.analyses = DimRedPlot.analyses;
        
      $scope.dimredplotWidth = "col-lg-" + (12 / $scope.analyses.length);

      if ($scope.analyses.length > 1) {
        if (!$scope.hideOptions) {
          switchOptions();
        }
      }
      
      $scope.$apply();
     
      $scope.$broadcast("DimRedPlot::resize", $scope.analyses.length);
    });
  });
