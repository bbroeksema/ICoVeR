/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3*/

var list = this.list || {};

// Reusable D3 chart. This renders a long bar highlighting the currently shown variances. It creates the elements in a svg tag.
list.VariancePercentagePlot = function () {
  "use strict";

  var size = {
      width: 500,
      height: 500
    },
    render = {},
    events = d3.dispatch.apply(this, ["rotate", "selectVariance"]);

  function vpp(selection) {
    selection.each(function (data) {

      if (!data) {return; }
      if (!data.variances) {throw "VarianceBarPlot expects an 'variances' property on the data"; }

      var svg = d3.select(this).selectAll("svg").data([data]);
      svg
        .enter()
        .append("svg")
        .append("g");

      render.resize(svg);
      render.variances(svg, data);
    });
  }

  render.resize = function (svg) {
    svg
      .attr("width", size.width)
      .attr("height", size.height);
  };

  render.variances = function (svg, data) {
    var gVariances = svg.select("g"),
      rect,
      text,
      varianceOffsets = [],
      idx,
      scroll = d3.behavior.zoom(),
      direction = scroll.scale(),
      dragging = false,
      draggedActive = 0,
      draggedIdx = 0;

    scroll
      .translate([1, 1])
      .on("zoom", function () {
        events.rotate(vpp, scroll.scale() > direction ? "up" : "down");
        direction = scroll.scale();
      });

    gVariances
      .call(scroll)
      .on("mousedown.zoom", null)
      .on("dblclick.zoom", null)
      .on("touchstart.zoom", null)
      .on("touchmove.zoom", null)
      .on("touchend.zoom", null);

    varianceOffsets.push(0);
    for (idx = 1; idx !== data.variances.length; idx += 1) {
      varianceOffsets.push(varianceOffsets[idx - 1] + data.variances[idx - 1]);
    }

    rect = gVariances.selectAll("rect.variance").data(data.variances);
    rect.enter().append("rect");
    rect.exit().remove();
    text = gVariances.selectAll("text.text").data(data.variances);
    text.enter().append("text").attr("class", "text");
    text.exit().remove();

    rect
      .transition()
      .duration(1500)
      .attr("height", size.height)
      .attr("x", function (d, i) {
        /*jslint unparam:true*/
        return size.width * (varianceOffsets[i] / 100);
      })
      .attr("width", function (d) {
        var width = size.width * (d / 100);
        if (width > 1) {
          width -= 1;
        }
        return width;
      });

    // Add text showing the variance values, but only if the text fits.
    text
      .text(function (d) {return Math.round(d * 100) / 100 + "%"; })
      .style("font-size", 10)
      .transition()
      .duration(1500)
      .attr("x", function (d, i) {
        /*jslint unparam:true*/
        return size.width * (varianceOffsets[i] / 100);
      })
      .style("visibility", function (d, i) {
        /*jslint unparam:true*/
        return this.getBBox().width <= Math.floor(size.width * (d / 100))
          ? "visible"
          : "hidden";
      })
      .attr("y", function (d, i) {
        /*jslint unparam:true*/
        return (0.7) * this.getBBox().height;
      })
      .style("pointer-events", "none");

    function mouseUp(d, i) {
      /*jslint unparam:true*/
      if (dragging) {
        dragging = false;
        events.selectVariance(vpp, draggedActive, draggedIdx);
      }
    }

    rect
      .classed("variance", true)
      .classed("active", function (d, i) {
        /*jslint unparam:true*/
        return data.actives[0].idx === i || data.actives[1].idx === i;
      })
      .on("mousemove", function (d, i) {
        list.DimRedPlot.setTooltip("Factor #" + (i + 1),
          "variance: " + Math.round(d * 100) / 100 + "%");
      })
      .on("mouseout", function (d, i) {
        var mouseX = d3.mouse(this)[0],
          mouseY = d3.mouse(this)[1];
        list.DimRedPlot.removeTooltip();
        if (mouseY >= size.height || mouseY < 0 || mouseX >= size.width - 1 || mouseX < 0) {
          mouseUp(d, i);
        }
      })
      .on("mouseenter", function (d, i) {
        /*jslint unparam:true*/
        var nonDraggedActive = draggedActive === 0 ? 1 : 0;

        if (dragging && data.actives[nonDraggedActive].idx !== i) {
          draggedIdx = i;
          rect.classed("active", function (d, rectIdx) {
            /*jslint unparam:true*/
            return rectIdx === i || data.actives[nonDraggedActive].idx === rectIdx;
          });
        }
      })
      .on("mousedown", function (d, i) {
        /*jslint unparam:true*/
        d3.event.preventDefault();

        if (data.actives[0].idx !== i && data.actives[1].idx !== i) {
          events.selectVariance(vpp, +(Math.abs(data.actives[0].idx - i) >= Math.abs(data.actives[1].idx - i)), i);
        } else {
          dragging = true;
          draggedIdx = i;
          draggedActive = +(data.actives[1].idx === i);
        }
      })
      .on("mouseup", mouseUp);
  };

  vpp.width = function (_) {
    if (!arguments.length) {return size.width; }
    size.width = _;
    return vpp;
  };

  vpp.height = function (_) {
    if (!arguments.length) {return size.height; }
    size.height = _;
    return vpp;
  };

  d3.rebind(vpp, events, "on");
  return vpp;
};
