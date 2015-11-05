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
    actives = {
      first: 0,
      second: 1,
      lastChanged: "first"
    },
    render = {},
    events = d3.dispatch.apply(this, ["activesChanged"]);

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
      dragging,
      draggedActive;

    scroll
      .translate([1, 1])
      .on("zoom", function () {
        var scrollUp = scroll.scale() > direction,
          addToActives = 0,
          update = false;

        direction = scroll.scale();

        function updateActive(active, other) {
          var newActive = actives[active] + addToActives;

          if (newActive >= 0 && newActive < data.variances.length && newActive !== actives[other]) {
            actives[active] = newActive;
            update = true;
          }
        }

        // The ordering of the updateActive calls is important to make sure
        // the two actives do not overlap
        if (scrollUp) {
          addToActives = 1;
          updateActive("second", "first");
          updateActive("first", "second");
        } else {
          addToActives = -1;
          updateActive("first", "second");
          updateActive("second", "first");
        }

        if (update) {
          events.activesChanged(vpp);
          render.variances(svg, data);
        }
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
        var rectWidth = size.width * (d / 100);

        return size.width * (varianceOffsets[i] / 100) + (rectWidth - this.getBBox().width) / 2;
      })
      .style("visibility", function (d, i) {
        /*jslint unparam:true*/
        return this.getBBox().width <= Math.floor(size.width * (d / 100))
          ? "visible"
          : "hidden";
      })
      .attr("y", function (d, i) {
        /*jslint unparam:true*/
        return (size.height + 0.7 * this.getBBox().height) / 2;
      })
      .style("pointer-events", "none");

    function resetActiveRects() {
      rect.classed("active", function (d, rectIdx) {
        /*jslint unparam:true*/
        return actives.first === rectIdx || actives.second === rectIdx;
      });
    }

    function changeActives() {
      // Make sure that the first active is always the x-axis
      if (actives.first > actives.second) {
        var tmp = actives.first;
        actives.first = actives.second;
        actives.second = tmp;

        actives.lastChanged = actives.lastChanged === "first" ? "second" : "first";
      }

      events.activesChanged(vpp);
    }

    function mouseUp(d, i) {
      /*jslint unparam:true*/
      if (dragging) {
        dragging = false;
        actives.lastChanged = draggedActive;
        changeActives();
      }
    }

    rect
      .classed("variance", true)
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
        if (dragging && actives.first !== i && actives.second !== i) {
          actives[draggedActive] = i;
          resetActiveRects();
        }
      })
      .on("mousedown", function (d, i) {
        /*jslint unparam:true*/
        d3.event.preventDefault();

        if (actives.first !== i && actives.second !== i) {
          var activeToChange = actives.lastChanged === "first" ? "second" : "first";

          actives[activeToChange] = i;
          actives.lastChanged = activeToChange;

          changeActives();
          render.variances(svg, data);
        } else {
          draggedActive = actives.first === i ? "first" : "second";
          dragging = true;
        }
      })
      .on("mouseup", mouseUp);

    resetActiveRects();
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

  vpp.actives = function (_) {
    if (!arguments.length) {return actives; }
    actives = _;
    if (actives.lastChanged === undefined) {
      actives.lastChanged = "first";
    }
    return vpp;
  };

  d3.rebind(vpp, events, "on");
  return vpp;
};
