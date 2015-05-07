/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3, _*/

var list = this.list || {};

// Reusable D3 chart. This renders a long bar highlighting the currently shown variances. It creates the elements in a svg tag.
list.ColourMap = function () {
  "use strict";

  var size = {
      width: 20
    },
    axisSide,
    render = {},
    colourFunction = d3.interpolateLab("steelblue", "brown"),
    scale = d3.scale.linear(),
    extent = [0, 0],
    events = d3.dispatch.apply(this, ["brushStart", "brush", "brushEnd"]);

  function cm(selection) {
    selection.each(function () {
      var element = d3.select(this);

      render.colormap(element);
      render.colormapBrush(element);
    });
  }

  // Renders a colormap with scale on the right side of the plot
  render.colormap = function (element) {
    var minRange = Math.min(scale.range()[0], scale.range()[1]),
      maxRange = Math.max(scale.range()[0], scale.range()[1]),
      numColors = Math.floor(maxRange - minRange - 1),
      colorData = [],
      frame,
      colors,
      colorGroup,
      axis,
      axisGroup,
      idx;

    for (idx = 0; idx !== numColors; idx += 1) {
      colorData.push(idx);
    }

    axis = d3.svg.axis()
      .scale(scale)
      .orient(axisSide);

    axisGroup = element.selectAll("g.coloraxis").data([true]);
    axisGroup.enter()
      .append("g")
      .attr("class", "coloraxis");

    if (axisSide === "right") {
      axisGroup.attr("transform", "translate(" + (size.width - 1) + ", 0)");
    }

    axisGroup
      .transition()
      .duration(1500)
      .call(axis);

    axisGroup.selectAll("text").style("font-size", "12px");
    axisGroup.selectAll("line, path")
      .style("fill", "none")
      .style("stroke", "#000");

    colorGroup = element.selectAll("g.colors").data([true]);
    colorGroup.enter()
      .append("g")
      .attr("class", "colors");
    colorGroup
      .attr("transform", "translate(0, " + minRange + ")");

    frame = colorGroup.selectAll("rect.colorframe").data([true]);
    frame
      .enter()
      .append("rect")
      .attr("class", "colorframe");
    frame
      .attr("width", size.width)
      .attr("height", maxRange - minRange);

    colors = colorGroup.selectAll("line.color").data(colorData);
    colors.enter()
      .append("line")
      .attr("class", "color");
    colors.exit().remove();
    colors
      .attr("x1", 1)
      .attr("y1", function (d) {
        return 1 + d;
      })
      .attr("x2", size.width - 1)
      .attr("y2", function (d) {
        return 1 + d;
      })
      .style("stroke-width", "2px");

    colors
      .style("stroke", function (d) {
        return colourFunction(scale.invert(d));
      });
  };

  render.colormapBrush = function (element) {
    var brush = d3.svg.brush(),
      brushGroup;

    function brushStart() {
      extent = brush.extent();
      events.brushStart();
    }

    function brushed() {
      extent = brush.extent();
      events.brush();
    }

    function brushEnd() {
      extent = brush.extent();
      events.brushEnd();
    }

    brush
      .y(scale)
      .extent(extent)
      .on("brushstart", brushStart)
      .on("brush", brushed)
      .on("brushend", brushEnd);

    //  Render the brush
    brushGroup = element.selectAll("g.brush").data([true]);
    brushGroup.enter().append("g").attr("class", "brush");
    brushGroup
      .call(brush);

    brushGroup.selectAll("rect")
      .attr("width", size.width);

    brushGroup.selectAll(".extent")
      .style("stroke", "#000")
      .style("fill-opacity", 0.125)
      .style("shape-rendering", "crispEdges");
  };

  cm.extent = function (_) {
    if (!arguments.length) {return extent; }
    extent = _;
    return cm;
  };

  cm.axisSide = function (_) {
    if (!arguments.length) {return axisSide; }
    axisSide = _;
    return cm;
  };

  cm.width = function (_) {
    if (!arguments.length) {return size.width; }
    size.width = _;
    return cm;
  };

  cm.scale = function (_) {
    if (!arguments.length) {return scale; }
    scale = _;
    return cm;
  };

  cm.colourFunction = function (_) {
    if (!arguments.length) {return colourFunction; }
    colourFunction = _;
    return cm;
  };

  d3.rebind(cm, events, "on");
  return cm;
};
