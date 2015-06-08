/*jslint browser:true, unparam: true, indent: 2, nomen: true */
/*global angular, d3, $, _, list*/

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
    $scope.$on("Colors::changed", function (e, rowColors, colorFunction, variable, domain) {
      /*jslint unparam:true todo:true*/
      //$scope.renderColourmap = true;
      //TODO fix this so it actualles uses ng-show
      d3.select($element[0]).style("display", "block");

      d.colourMapScale.domain(domain);
      d.colourMap.scale(d.colourMapScale);
      d.colourMap.colourFunction(colorFunction);

      d.title.text(variable);
      resize();
    });
  });
