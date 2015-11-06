/*jslint browser:true, unparam: true, indent: 2, nomen: true */
/*global angular, d3, $, _, list*/

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
  .controller('ColourmapCtrl', function ($scope, $window, $element, DataSet, ParCoords, Color) {
    'use strict';

    //$scope.renderColourmap = false;
    d3.select($element[0]).style("display", "none");

    /// private Controller vars
    var d = {
      colourMap: list.ColourMap(),
      colourMapScale: d3.scale.linear(),
      colourMapGroup: null,
      title: null
    };

    /// private controller functions
    function render() {
      d.colourMapGroup
        .select("g")
        .call(d.colourMap);
    }

    function resize() {
      d.colourMapScale.range([$element[0].clientHeight - 15, 22]);

      d.colourMap
        .scale(d.colourMapScale);

      d.colourMapGroup.attr("height", $element[0].clientHeight);

      d.title
        .attr("y", d.title.node().clientHeight)
        .attr("x", -d.title.node().clientWidth + 20);

      render();
    }

    /// Initialization
    d.colourMapScale
      .domain([0, 1])
      .range([$element[0].clientHeight, 0]);

    d.colourMap
      .width(20)
      .axisSide("left")
      .extent([0, 0])
      .scale(d.colourMapScale);
      /*.on("brush", function () {


      });*/

    d.colourMapGroup = d3.select($element[0]).selectAll("svg.colourmap").data([true]);
    d.colourMapGroup.enter()
      .append("svg")
      .attr("class", "colourmap")
      .append("g")
      .attr("transform", "translate(" + 60 + ", 4)")
      .append("text")
      .attr("class", "label");

    d.title = d.colourMapGroup.select("text.label")
      .text("influence");

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    /// Scope extensions
    $scope.$on("Colors::changed", function (e, rowColors) {
      /*jslint unparam:true todo:true*/
      //$scope.renderColourmap = true;
      //TODO fix this so it actualles uses ng-show
      d3.select($element[0]).style("display", "block");

      //d.colourMapScale.domain(domain);
      d.colourMap.scale(d.colourMapScale);
      d.colourMap.colourFunction(Color.colorFn());

      d.title.text(Color.colorVariable());
      resize();
    });
  });
