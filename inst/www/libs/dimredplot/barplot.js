/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3*/

var list = this.list || {};

// Reusable D3 chart. This renders a barplot with a label and a percentage. It
// creates the elements in a svg tag.
list.BarPlot = function () {
  "use strict";

  var size = {
      width: 500,
      height: 500
    },
    barsYOffset,
    render = {},
    events = d3.dispatch.apply(this, ["brush", "brushEnd"]);

  function bp(selection) {
    selection.each(function (data) {

      if (!data) {return; }
      if (!data.contributions) {throw "BarPlot expects an 'contributions' property on the data"; }
      if (data.contributions.length === 0) {throw "BarPlot expects 'contributions' to contain data"; }
      if (!data.component) {throw "BarPlot expects an 'component' property on the data"; }

      var svg = d3.select(this).selectAll("svg").data([data]);
      svg
        .enter()
        .append("svg")
        .append("g");

      render.resize(svg);
      render.label(svg, data);
      render.contributions(svg, data);
    });
  }

  render.resize = function (svg) {
    svg
      .attr("width", size.width)
      .attr("height", size.height);
  };

  render.label = function (svg, data) {
    var gContributions = svg.select("g"),
      label,
      textHeight,
      text,
      selectedContributionSum = 0,
      contributionSum = 0;

    //  Calculate percentage of contribution in current selection
    data.contributions.forEach(function (d) {
      if (d.selected !== list.selected.NONE) {
        selectedContributionSum += d.contribution;
      }
      contributionSum += d.contribution;
    });

    text = data.component + ": ";

    if (data.variance !== null) {
      if (selectedContributionSum !== 0) {
        selectedContributionSum = selectedContributionSum / contributionSum * data.variance;

        text += Math.round(selectedContributionSum * 100) / 100 + "% / ";
      }

      text += Math.round(data.variance * 100) / 100 + "%";
    }

    //  Add the label
    label = gContributions.selectAll("text").data([data]);
    label
      .enter()
      .append("text");
    label
      .text(text)
      .style("font-size", "12px")
      .transition()
      .duration(1500);

    textHeight = label.node().getBBox().height;
    barsYOffset = textHeight;

    label.attr("y", textHeight);
  };

  render.contributions = function (svg, data) {
    var gContributions = svg.select("g"),
      bars,
      barWidth = size.width / data.contributions.length,
      barHeight = d3.scale.linear(),
      maxBarHeight = size.height - barsYOffset,
      brush = d3.svg.brush(),
      brushGroup,
      brushScale = d3.scale.quantize();

    barHeight
      .domain([0, data.maxContribution])
      .range([0, maxBarHeight]);

    // TODO: fix code reuse
    //  Add the brush
    function brushed() {
      var extent0 = brush.extent(),
        extent1,
        d0 = Math.round(extent0[0] / barWidth) * barWidth,
        d1 = Math.round(extent0[1] / barWidth) * barWidth;

      extent1 = [d0, d1];

      d3.select(this).call(brush.extent(extent1));

      events.brushEnd(bp, data.index, Math.round(extent1[0] / barWidth), Math.round(extent1[1] / barWidth));
    }

    function brushing() {
      var extent0 = brush.extent(),
        extent1,
        d0 = Math.round(extent0[0] / barWidth) * barWidth,
        d1 = Math.round(extent0[1] / barWidth) * barWidth;

      extent1 = [d0, d1];

      d3.select(this).call(brush.extent(extent1));

      events.brush(bp, data.index, Math.round(extent1[0] / barWidth), Math.round(extent1[1] / barWidth));
    }

    brushScale
      .range([0, size.width])
      .domain(Array.apply(null, {length: data.contributions.length}).map(Number.call, Number));

    brush.x(brushScale);
    brush.extent([data.brushExtent[0] * barWidth, data.brushExtent[1] * barWidth]);

    brush.on("brushend", brushed);
    brush.on("brush", brushing);

    //  Add the bars
    bars = gContributions.selectAll("rect.contribution").data(data.contributions);
    bars
      .enter()
      .append("rect");
    bars.exit().remove();
    bars
      .attr("width", barWidth)
      .attr("height", function (d) {return barHeight(d.contribution); })
      .attr("x", function (d, i) {/*jslint unparam:true*/return i * barWidth; })
      .attr("y", function (d) {return size.height - barHeight(d.contribution); })
      .attr("class", "contribution")
      .style("fill", function (d) {
        return d.selected !== list.selected.NONE ? "red" : "steelblue";
      });

    //  Render the brush
    brushGroup = gContributions.selectAll("g.brush").data([true]);
    brushGroup.enter().append("g").attr("class", "brush");
    brushGroup
      .on("mousemove", function () {
        var mouseX = d3.mouse(this)[0],
          contributionIdx = Math.floor(mouseX / barWidth);

        list.DimRedPlot.setTooltip(data.contributions[contributionIdx].label,
          data.component + " contribution: " + Math.round(data.contributions[contributionIdx].contribution * 100) / 100 + "%");
      })
      .on("mouseout", function () {
        list.DimRedPlot.removeTooltip();
      })
      .call(brush);

    brushGroup.selectAll("rect")
      .attr("height", maxBarHeight)
      .attr("y", barsYOffset);
  };

  bp.width = function (_) {
    if (!arguments.length) {return size.width; }
    size.width = _;
    return bp;
  };

  bp.height = function (_) {
    if (!arguments.length) {return size.height; }
    size.height = _;
    return bp;
  };

  d3.rebind(bp, events, "on");
  return bp;
};