/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3, _*/

var list = this.list || {};

// Reusable D3 chart. This creates a scatterplot.  It creates the elements in a svg tag.
list.ScatterPlot = function () {
  "use strict";

  var size = { width: 500, height: 500 },
    svgMargins = { top: 20, bottom: 20, left: 35, right: 50 },
    pointMargin = 5,
    render = {},
    colormap = {},
    events = d3.dispatch.apply(this, ["selectionEnd", "brushEnd"]),
    origin = { size: 25, visible: true};

  function xyContribution(d, data) {
    return (d.xContribution * data.xVariance + d.yContribution * data.yVariance) / (data.xVariance + data.yVariance);
  }

  function updateScales(data, scales) {
    var domain, range,  // output range
      largestContribution;

    // Update the colormap scale
    domain = d3.extent(data.points, function (d) { return xyContribution(d, data); });
    range = [size.height - svgMargins.top - svgMargins.bottom, 0];
    scales.colormap.domain(domain).range(range);
    largestContribution = domain[1];

    // Update the color scale
    range = [0, 1];
    scales.color.domain(domain).range(range);

    // Update the cx scale
    domain = [0, 100]; // Contributions are in %
    range = [2, 50];
    scales.cx.domain(domain).range(range);

    // Update the cy scale
    domain = [0, 100]; // Contributions are in %
    range = [2, 50];
    scales.cy.domain(domain).range(range);

    // Make sure that none of the points overflow the plot space
    pointMargin = scales.cx(largestContribution);

    // Update the x scale
    domain = d3.extent(data.points, function (d) { return d.x; }); // input domain
    range = [pointMargin, size.width - svgMargins.right - svgMargins.left - pointMargin];  // output range
    scales.x.domain(domain).range(range);
    // Use the created scale to update the scale in order to have it span the entire plot
    range = [0, size.width - svgMargins.right - svgMargins.left];
    domain = [scales.x.invert(range[0]), scales.x.invert(range[1])];
    scales.x.domain(domain).range(range);

    // Update the y scale
    domain = d3.extent(data.points, function (d) { return d.y; });
    range = [size.height - svgMargins.top - svgMargins.bottom - pointMargin, pointMargin];
    scales.y.domain(domain).range(range);
    // Use the created scale to update the scale in order to have it span the entire plot
    range = [size.height - svgMargins.top - svgMargins.bottom, 0];
    domain = [scales.y.invert(range[0]), scales.y.invert(range[1])];
    scales.y.domain(domain).range(range);
  }

  function setSelected(point) {
    if (point.selected === list.selected.NONE) {
      point.selected = list.selected.POINT;
    } else if (point.selected === list.selected.BAR) {
      point.selected = list.selected.BOTH;
    }
  }

  function setNotSelected(point) {
    if (point.selected === list.selected.POINT) {
      point.selected = list.selected.NONE;
    } else if (point.selected === list.selected.BOTH) {
      point.selected = list.selected.BAR;
    }
  }

  function sp(selection) {
    selection.each(function (data) {
      var sortedPoints,
        group,
        svg,
        scales = {
          x: d3.scale.linear(),
          y: d3.scale.linear(),
          cx: d3.scale.linear(),
          cy: d3.scale.linear(),
          colormap: d3.scale.linear(),
          color: d3.scale.linear()
        },
        selectCircleRadius = 40;

      if (!data) {return; }
      if (!data.points) {throw "ScatterPlot expects a 'points' property on the data"; }

      svg = d3.select(this).selectAll("svg").data([data]);
      svg
        .enter()
        .append("svg")
        .append("g")
        .attr("class", "points");

      updateScales(data, scales);

      if (data.flags.pointsChanged) {
        svg.selectAll("g.points")
          .attr("transform", "translate(" + svgMargins.left + ", " + svgMargins.top + ")");

        data.points.forEach(function (point) {
          point.hovered = false;
        });

        // The points are displayed from high contribution to low contribution
        sortedPoints = _.sortBy(data.points, function (d) {
          return -xyContribution(d, data);
        });

        // Add the necessary elements
        render.resize(svg);
        render.title(svg, data.title);
        render.points(svg, data, scales);
        //render.colormap(svg, data, scales);
        render.axes(svg, scales);

        render.origin(svg, scales);
        render.interactionOverlay(svg, data, scales, selectCircleRadius);
      }

      render.colormap(svg, data, scales);
      render.selectionOnColormap(svg, data, scales);
      render.colorPoints(svg, data, scales);

      if (data.flags.pointsChanged) {
        // The creation of the label groups happens here because the labels need to be created after the points
        group = svg.select("g.points").selectAll("g.pointlabel").data(sortedPoints);
        group.enter()
          .append("g")
          .attr("class", "pointlabel")
          .each(function () {
            var self = d3.select(this);
            self.append("rect")
              .attr("class", "pointlabel");

            self.append("line")
              .attr("class", "pointlabel");

            self.append("text")
              .attr("pointer-events", "none")
              .attr("class", "pointlabel")
              .style("font-size", "10px");
          })
          .style("visibility", "hidden");

        group.select("text")
          .text(function (d) { return d.wrappedLabel; });

        group.exit().remove();
        //render.clusteredLabels(svg, data.points, scales);
      }
    });
  }

  render.resize = function (svg) {
    svg
      .attr("width", size.width)
      .attr("height", size.height);
  };

  render.title = function (svg, title) {
    var titleSelection = svg.selectAll("text.title").data([title]);

    titleSelection.enter()
      .append("text")
      .attr("class", "title")
      .style("font-size", "12px");

    titleSelection
      .text(title)
      .attr("y", titleSelection.node().getBBox().height)
      .attr("x", 4);
  };

  //  Draws every points as an ellipse, elongated by the x+y contribution,
  //  rotated by the x and y contributions
  render.pointsAsEllipses1 = function (gPoints, data, scales) {
    var ellipse = gPoints.selectAll("g.point").data(data.points);

    // We need to put out ellipses into groups otherwise the rotating/translation
    // that the ellipses are doing during transitioning will be wrong.
    ellipse.enter()
      .append("g")
      .attr("class", "point")
      .append("ellipse")
      .attr("class", "point");

    ellipse.style("visibility", null);
    ellipse
      .transition()
      .duration(1500)
      .attr("transform", function (d) {
        return "translate(" + scales.x(d.x) + ", " + scales.y(d.y) + ")";
      });

    ellipse.select("ellipse")
      .transition()
      .duration(1500)
      .attr("rx", function (d) {
        var xContribution = scales.cx(d.xContribution * data.xVariance / (data.xVariance + data.yVariance)),
          yContribution = scales.cy(d.yContribution * data.yVariance / (data.xVariance + data.yVariance));

        return Math.sqrt(xContribution * xContribution + yContribution * yContribution);
      })
      .attr("ry", function (d) {
        var xContribution = scales.cx(d.xContribution * data.xVariance / (data.xVariance + data.yVariance)),
          yContribution = scales.cy(d.yContribution * data.yVariance / (data.xVariance + data.yVariance));

        return (Math.min(xContribution, yContribution) / Math.max(xContribution, yContribution)) * Math.sqrt(xContribution * xContribution + yContribution * yContribution);
      })
      .attr("transform", function (d) {
        /*jslint unparam:true*/
        var xContribution = d.xContribution * data.xVariance,
          yContribution = d.yContribution * data.yVariance;

        xContribution *= Math.sign(d.x);
        yContribution *= Math.sign(d.y);

        return "rotate(" + Math.atan2(yContribution, -xContribution) / Math.PI * 180 + ")";
      });

    ellipse.exit().remove();

    return ellipse.select("ellipse");
  };

  //  Draws every points as an ellipse, elongated by the x+y contribution,
  //  rotated by the x and y contributions
  render.pointsAsEllipses2 = function (gPoints, data, scales) {
    var ellipse = gPoints.selectAll("g.point").data(data.points);

    // We need to put out ellipses into groups otherwise the rotating/translation
    // that the ellipses are doing during transitioning will be wrong.
    ellipse.enter()
      .append("g")
      .attr("class", "point")
      .append("ellipse")
      .attr("class", "point");

    ellipse.style("visibility", null);
    ellipse
      .transition()
      .duration(1500)
      .attr("transform", function (d) {
        return "translate(" + scales.x(d.x) + ", " + scales.y(d.y) + ")";
      });

    ellipse.select("ellipse")
      .transition()
      .duration(1500)
      .attr("rx", function (d) {
        return scales.cx(xyContribution(d, data));
      })
      .attr("ry", function (d) {
        return scales.cx(xyContribution(d, data)) / 4;
      })
      .attr("transform", function (d) {
        /*jslint unparam:true*/
        var xContribution = d.xContribution * data.xVariance,
          yContribution = d.yContribution * data.yVariance;

        xContribution *= Math.sign(d.x);
        yContribution *= Math.sign(d.y);

        return "rotate(" + Math.atan2(yContribution, -xContribution) / Math.PI * 180 + ")";
      });

    ellipse.exit().remove();

    return ellipse.select("ellipse");
  };

  //  Draws every point as an rectangle. The width and height of the rectangle
  //  are based on the x and y contributions.
  render.pointsAsRectangles = function (gPoints, data, scales) {
    var rect = gPoints.selectAll("rect.point").data(data.points),
      totalVariance = data.xVariance + data.yVariance;

    //  This needs to be uncommented for the experimental functions to work
    //render.subPoints2(gPoints, points, 0, 0, "first", 0);
    //render.subPoints2(gPoints, points, 2, 0, "second", 1);
    //render.subPoints2(gPoints, points, 0, 2, "third", 2);
    //render.subPoints2(gPoints, points, 2, 2, "fourth", 3);
    //return;

    // Points width and height are based on their contributions to their
    // respective principal axes. Contributions help locating the the variables
    // important for a given principal axes. As a rule of the tumb, points with
    // a contribution larger than the average contribute (1/numberOfVars) are
    // considered the important ones.

    rect.enter().append("rect")
      .attr("class", "point");

    rect.style("visibility", null);
    rect.exit().remove();
    rect
      .transition()
      .duration(1500)
      .attr("x", function (d) { return scales.x(d.x) - scales.cx(d.xContribution * data.xVariance / totalVariance) / 2; })
      .attr("y", function (d) { return scales.y(d.y) - scales.cy(d.yContribution * data.yVariance / totalVariance) / 2; })
      .attr("width", function (d) { return scales.cx(d.xContribution * data.xVariance / totalVariance); })
      .attr("height", function (d) { return scales.cy(d.yContribution * data.yVariance / totalVariance); });

    return rect;
  };

  // Draws a circle that can be used as selection brush and to hover over items, displaying their labels,
  // also handles all mouse events necessary for the hovering and selecting.
  render.interactionOverlay = function (svg, data, scales, selectCircleRadius) {
    var gPoints = svg.select("g.points"),
      hoverCircle,
      scroll = d3.behavior.zoom(),
      scrollDirection = scroll.scale(),
      inputRect,
      dragging = false,
      plotHeight = size.height - svgMargins.top - svgMargins.bottom,
      plotWidth = size.width - svgMargins.left - svgMargins.right,
      pointsSelected = false,
      pointsHovered = false,
      updateOnMouseUp = false;

    // Add the circle that is displayed at the mouse
    hoverCircle = gPoints.selectAll("circle.select").data([true]);
    hoverCircle.enter().append("circle")
      .attr("class", "select")
      .style("fill-opacity", 0.0)
      .style("stroke-width", 1.0)
      .style("stroke", "#000")
      .style("visibility", "hidden");

    hoverCircle.attr("r", selectCircleRadius);

    scroll
      .translate([1, 1])
      .on("zoom", function () {
        if (scroll.scale() > scrollDirection) {
          selectCircleRadius += 2;
        } else {
          selectCircleRadius -= 2;
        }
        selectCircleRadius = Math.max(Math.min(selectCircleRadius, 120), 2);
        hoverCircle.attr("r", selectCircleRadius);
        scrollDirection = scroll.scale();
        inputRect.on("mousemove")();
      });

    // Add a plot-sized rectangle, handling all the input
    gPoints.select("rect.select").remove();
    inputRect = gPoints
      .append("rect")
      .attr("class", "select")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", plotWidth)
      .attr("height", plotHeight)
      .style("visibility", "hidden")
      .attr("pointer-events", "all");

    function mouseMove() {
      var mouse = d3.mouse(inputRect.node());

      hoverCircle
        .attr("cx", mouse[0])
        .attr("cy", mouse[1])
        .style("visibility", "visible");

      data.points.forEach(function (point) {
        var xDiff = scales.x(point.x) - mouse[0],
          yDiff = scales.y(point.y) - mouse[1];

        // Check if points are withing the circles range and select/hover them
        if (xDiff * xDiff + yDiff * yDiff < selectCircleRadius * selectCircleRadius) {
          if (dragging === true) {
            setSelected(point);
            pointsSelected = true;
            updateOnMouseUp = true;
          } else {
            point.hovered = true;
            pointsHovered = true;
          }
        } else {
          if (point.hovered) {
            point.hovered = false;
            pointsHovered = true;
          }
        }
      });

      // Only re-render when something actually changed
      if (pointsSelected) {
        render.colorPoints(svg, data, scales);
      }
      if (pointsHovered) {
        render.excentricLabels(svg, data.points, mouse[1], scales);
      }

      pointsHovered = false;
      pointsSelected = false;
    }

    function mouseUp() {
      var selected = [];
      dragging = false;
      if (updateOnMouseUp) {
        updateOnMouseUp = false;

        data.points.forEach(function (d) {
          selected.push(d.selected === list.selected.POINT || d.selected === list.selected.BOTH);
        });

        events.selectionEnd(sp, selected, data.idx);
      }
    }

    inputRect
      .on("mousemove", mouseMove)
      .on("mouseout", function () {
        hoverCircle.style("visibility", "hidden");

        // Removing the mouse from the plot will result in no more hovered points
        data.points.forEach(function (point) {
          if (point.hovered) {
            point.hovered = false;
            pointsHovered = true;
          }
        });

        if (pointsHovered) {
          render.excentricLabels(svg, data.points, 0, scales);
        }

        pointsHovered = false;
        pointsSelected = false;
        mouseUp();
      })
      .on("mousedown", function () {
        var ctrlOrShiftPressed = d3.event.ctrlKey || d3.event.shiftKey;

        d3.event.preventDefault();

        // Clicking cancels all hovering and removes the current selection
        data.points.forEach(function (point) {
          point.hovered = false;
          pointsHovered = true;
          if ((point.selected === list.selected.BOTH || point.selected === list.selected.POINT) && !ctrlOrShiftPressed) {
            setNotSelected(point);

            pointsSelected = true;
            updateOnMouseUp = true;
          }
        });

        dragging = true;

        mouseMove();
      })
      .on("mouseup", mouseUp)
      .call(scroll)
      .on("mousedown.zoom", null)
      .on("touchstart.zoom", null)
      .on("touchmove.zoom", null)
      .on("touchend.zoom", null);
  };

  colormap.blackRed = d3.interpolateLab("black", "red");
  colormap.blackBlue = d3.interpolateLab("black", "blue");
  colormap.blueRed = d3.interpolateLab("blue", "red");
  colormap.greenRed = d3.interpolateLab("green", "red");
  colormap.rainbow = function (val) {
    return d3.hsl((1 - val) * 240, 1, 0.5);
  };

  render.colormap = function (svg, data, scales) {
    var gPoints = svg.select("g.points"),
      plotWidth = size.width - svgMargins.right - svgMargins.left,
      colourMap = list.ColourMap(),
      colourMapGroup;

    function brush() {
      var extent = colourMap.extent();

      data.brushExtent = extent;

      data.points.forEach(function (d) {
        var contribution = xyContribution(d, data);
        setNotSelected(d);

        if (contribution >= extent[0] && contribution <= extent[1]) {
          setSelected(d);
        }
      });
      render.colorPoints(svg, data, scales);
    }

    function brushEnd() {
      var selected = [];
      data.points.forEach(function (d) {
        selected.push(d.selected === list.selected.POINT || d.selected === list.selected.BOTH);
      });
      events.brushEnd(sp, selected, data.idx, colourMap.extent()[0], colourMap.extent()[1]);
    }

    colourMap
      .width(20)
      .extent(data.brushExtent)
      .scale(scales.colormap)
      .axisSide("right")
      .colourFunction(function (datum) {
        return colormap[data.colormap](scales.color(datum));
      })
      .on("brush", brush)
      .on("brushEnd", brushEnd);

    colourMapGroup = gPoints.selectAll("g.colourmap").data([true]);
    colourMapGroup.enter().append("g").attr("class", "colourmap");
    colourMapGroup
      .attr("transform", "translate(" + plotWidth + ", 0)")
      .call(colourMap);

  };

  // Renders the x and y axes
  render.axes = function (svg, scales) {
    var gPoints = svg.select("g.points"),
      plotHeight = size.height - svgMargins.top - svgMargins.bottom,
      xAxis,
      yAxis,
      axisGroup;

    xAxis = d3.svg.axis()
      .scale(scales.x)
      .orient("bottom");

    yAxis = d3.svg.axis()
      .scale(scales.y)
      .orient("left");

    axisGroup = gPoints.selectAll("g.xaxis").data([true]);
    axisGroup.enter()
      .append("g")
      .attr("class", "xaxis");
    axisGroup
      .attr("transform", "translate(0, " + plotHeight + ")")
      .transition()
      .duration(1500)
      .call(xAxis);

    axisGroup = gPoints.selectAll("g.yaxis").data([true]);
    axisGroup.enter()
      .append("g")
      .attr("class", "yaxis");
    axisGroup
      .transition()
      .duration(1500).call(yAxis);

  };

  // Wrapper function that sets up the axis and calls another function to render the actual points.
  render.points = function (svg, data, scales) {
    var gPoints = svg.select("g.points");

    //render.pointsAsEllipses2(gPoints, data, scales)
    if (data.renderFunction.indexOf("pointsAsEllipses") > -1) {
      gPoints.selectAll("rect.point").style("visibility", "hidden");
    } else if (data.renderFunction === "pointsAsRectangles") {
      gPoints.selectAll("g.point").style("visibility", "hidden");
    }

    render[data.renderFunction](gPoints, data, scales);
  };

  render.selectionOnColormap = function (svg, data, scales) {
    var gPoints = svg.select("g.points"),
      plotWidth = size.width - svgMargins.right - svgMargins.left,
      colors;

    colors = gPoints.selectAll("line.selection").data(data.points);
    colors.enter()
      .append("line")
      .attr("class", "selection")
      .attr("x1", plotWidth + 3)
      .attr("y1", function (d) {
        return scales.colormap(xyContribution(d, data));
      })
      .attr("x2", plotWidth + 20 - 3)
      .attr("y2", function (d) {
        return scales.colormap(xyContribution(d, data));
      })
      .style("stroke-width", "1px")
      .style("stroke", "black");

    colors
      .style("visibility", function (d) {
        return d.selected !== list.selected.NONE ? "visible" : "hidden";
      });

    colors.exit().remove();
  };

  // Sets the color of the points, this is separated from the points function because sometimes a recolour is
  // all that is needed for an update.
  render.colorPoints = function (svg, data, scales) {
    var contributionColorMap = colormap[data.colormap],
      points,
      isSelected = false;

    if (data.renderFunction.indexOf("pointsAsEllipses") > -1) {
      points = svg.select("g.points").selectAll("ellipse.point");
    } else if (data.renderFunction === "pointsAsRectangles") {
      points = svg.select("g.points").selectAll("rect.point");
    }

    isSelected = data.brushExtent[0] !== data.brushExtent[1] || data.points.some(function (d) {
      return d.selected !== list.selected.NONE;
    });

    if (isSelected || data.isInfluenced) {
      points.style("fill", function (d, idx) {
        var contributionColor = contributionColorMap(scales.color(xyContribution(d, data))),
          influence = data.points[idx].influence;

        if (data.points[idx].selected !== list.selected.NONE) {
          influence = 1;
        }

        // When selecting points it is not necessary to calculate the expensive interpolate function
        if (influence === 0) {
          return "rgb(230, 230, 230)";
        }
        if (influence === 1) {
          return contributionColor;
        }
        return d3.interpolateHsl("rgb(255, 255, 255)", contributionColor)(influence * 0.9 + 0.1);
      });
    } else {
      points.style("fill", function (d) {
        return contributionColorMap(scales.color(xyContribution(d, data)));
      });
    }
  };

  // Renders labels by first clustering the points that need a label and then rendering
  // clustered labels wherever necessary
  render.clusteredLabels = function (svg, points, scales) {
    var gPoints = svg.select("g.points"),
      group = gPoints.selectAll("g.pointlabel").data(points),
      filteredGroup,
      clusters = [/*{points: [], avgY: 0}*/],
      textHeight = 8 * 1.2,
      renderedClusters = [];

    // Every label has its own group, making it easier to move the entire label at once
    group.enter()
      .append("g")
      .attr("class", "pointlabel")
      .each(function () {
        var self = d3.select(this);
        self.append("rect")
          .attr("class", "pointlabel");

        self.append("line")
          .attr("class", "pointlabel");

        self.append("text")
          .attr("pointer-events", "none")
          .attr("class", "pointlabel");
      });
    group.exit().remove();

    group.style("visibility", "hidden");

    // Create a filtered group that only contains the labels that should be drawn
    filteredGroup = group.filter(function (d) {
      return d.selected !== list.selected.NONE;
    });
    filteredGroup
      .style("visibility", "visible")
      .select("text")
      .style("font-size", "8px")
      .text(function (d) { return d.wrappedLabel; })
      .each(function (point, idx) {
        // Every point is put in its own cluster, which makes the clustering routine a lot easier,
        // this is because now we only have to write code which merges clusters
        clusters.push({points: [idx], avgY: scales.y(point.y)});
        point.clusterIdx = idx;
      });

    // Clusters the groups into clusters that each have overlapping labels
    filteredGroup.each(function (outerPoint, outerIdx) {
      filteredGroup.each(function (innerPoint, innerIdx) {
        var outerClusterIdx = outerPoint.clusterIdx,
          innerClusterIdx = innerPoint.clusterIdx,
          innerY = clusters[innerClusterIdx].avgY,
          outerY = clusters[outerClusterIdx].avgY,
          yDistance = clusters[innerClusterIdx].points.length + clusters[outerClusterIdx].points.length;

        if (outerIdx <= innerIdx) { return; }

        if (Math.abs(outerY - innerY) < yDistance * textHeight / 2 &&
            Math.abs(scales.x(outerPoint.x) - scales.x(innerPoint.x)) < 80) {

          if (outerClusterIdx === innerClusterIdx) {
            return;
          }

          // The two clusters overlap and are not the same cluster

          clusters[outerClusterIdx].avgY = outerY * clusters[outerClusterIdx].points.length;
          clusters[outerClusterIdx].avgY += innerY * clusters[innerClusterIdx].points.length;
          clusters[outerClusterIdx].avgY /= clusters[innerClusterIdx].points.length + clusters[outerClusterIdx].points.length;

          clusters[innerClusterIdx].points.forEach(function (idx) {
            clusters[outerClusterIdx].points.push(idx);
            filteredGroup.data()[idx].clusterIdx = outerClusterIdx;
          });
          clusters[innerClusterIdx] = {points: [], avgY: 0};
          return;
        }
      });
    });

    clusters.forEach(function (cluster, idx, scales) {
      var groupCluster,
        boundingBox = {x1: 100000, y1: 100000, x2: 0, y2: 0},
        renderedCluster,
        leftDisplay = true,
        rightDisplay = true,
        leftGroup,
        rightGroup;

      if (cluster.points.length === 0) { return; }

      groupCluster = filteredGroup.filter(function (d) {
        return d.clusterIdx === idx;
      });

      // Get selected points bounding box
      groupCluster.each(function (d) {
        var x = scales.x(d.x),
          y = scales.y(d.y);

        boundingBox.x1 = Math.min(boundingBox.x1, x);
        boundingBox.y1 = Math.min(boundingBox.y1, y);
        boundingBox.x2 = Math.max(boundingBox.x2, x);
        boundingBox.y2 = Math.max(boundingBox.y2, y);
      });

      // Check whether we can render the labels to the left or to the right of the points
      if (boundingBox.x1 < 80 + 20) { leftDisplay = false; }
      if (scales.x.range()[1] - boundingBox.x2 < 80 + 20) { rightDisplay = false; }

      if (leftDisplay && rightDisplay) {
        leftGroup = groupCluster.filter(function (d, i) {
          /*jslint unparam:true*/
          return i < groupCluster.size() / 2;
        });
        rightGroup = groupCluster.filter(function (d, i) {
          /*jslint unparam:true*/
          return i >= groupCluster.size() / 2;
        });
      } else if (leftDisplay) {
        leftGroup = groupCluster;
        rightGroup = groupCluster.filter(function () { return false; });
      } else if (rightDisplay) {
        rightGroup = groupCluster;
        leftGroup = groupCluster.filter(function () { return false; });
      } else {
        // TODO: find a solution to no labels being shown here
        return;
      }

      // Render the labels as a (potential) left column and a (potential) right column
      renderedCluster = render.labelColumn(leftGroup,
        boundingBox.x1 - 80 - 20, (boundingBox.y1 + boundingBox.y2) / 2, boundingBox.x1 - 20,
        80, textHeight, scales);
      renderedClusters.push(renderedCluster);

      renderedCluster = render.labelColumn(rightGroup,
        boundingBox.x2 + 20, (boundingBox.y1 + boundingBox.y2) / 2, boundingBox.x2 + 20,
        80, textHeight, scales);
      renderedClusters.push(renderedCluster);
    });

    group.exit().remove();
  };

  function moveCluster(group, x, y, scales) {
    group.attr("transform", "translate(" + x + ", " + y + ")");

    group.select("line")
      .attr("x2", function (d) {
        return scales.x(d.x) - x;
      })
      .attr("y2", function (d) {
        return scales.y(d.y) - y;
      });
  }

  // Draws one column of labels, is called by multiple functions
  render.labelColumn = function (group, x, y, xLine, textWidth, textHeight, scales) {
    var yOffset,
      columnHeight = group.size() * textHeight;

    yOffset = Math.max(0,
      Math.min(scales.y.range()[0] - columnHeight,
        y - columnHeight / 2));

    group.select("line")
      .transition()
      .duration(100)
      .attr("x1", xLine - x)
      .attr("y1", function (d, i) {
        /*jslint unparam:true*/
        return (i + 0.5) * textHeight;
      });

    group.select("rect")
      .transition()
      .duration(100)
      .attr("y", function (d, i) {
        /*jslint unparam:true*/
        return i * textHeight;
      })
      .attr("width", textWidth)
      .attr("height", textHeight);

    group.select("text")
      .transition()
      .duration(100)
      .attr("x", 1)
      .attr("y", function (d, i) {
        /*jslint unparam:true*/
        return (i + 0.7) * textHeight;
      });

    moveCluster(group, x, yOffset, scales);

    return {cluster: group, boundingBox: {x1: x, y1: yOffset, x2: x + textWidth, y2: yOffset + textHeight}};
  };

  // Draws labels, with the assumptions that they are from points of a tight cluster
  render.excentricLabels = function (svg, points, focusY, scales) {
    var group,
      boundingBox = {x1: 100000, y1: 100000, x2: 0, y2: 0},
      numSelected = 0,
      textHeight = 10 * 1.2,
      maxLeftTextWidth = 0,
      maxRightTextWidth = 0,
      leftDisplay = true,
      rightDisplay = true,
      leftGroup,
      rightGroup,
      plotHeight = size.height - svgMargins.top - svgMargins.bottom,
      numColumns,
      datum;

    // Get selected points bounding box
    points.forEach(function (d) {
      var x = scales.x(d.x),
        y = scales.y(d.y);

      if (d.hovered) {
        numSelected += 1;
        boundingBox.x1 = Math.min(boundingBox.x1, x);
        boundingBox.y1 = Math.min(boundingBox.y1, y);
        boundingBox.x2 = Math.max(boundingBox.x2, x);
        boundingBox.y2 = Math.max(boundingBox.y2, y);
      }
    });

    group = svg.selectAll("g.pointlabel");

    group.select("line")
      .style("visibility", null);

    group.style("visibility", "hidden");

    group = group.filter(function (d) {
      return d.hovered;
    });

    // If only one point is selected we show an extended tooltip
    if (numSelected === 1) {
      datum = group.data()[0];
      list.DimRedPlot.setTooltip(datum.label,
        "x factor: " + datum.x + "<br>" +
        "y factor: " + datum.y + "<br>" +
        "x contribution: " + datum.xContribution + "<br>" +
        "y contribution: " + datum.yContribution + "<br>" +
        "mass: " + datum.mass);
      return;
    }
    list.DimRedPlot.removeTooltip();

    group.select("text")
      .text(function (d) { return d.wrappedLabel; })
      .each(function (d, i) {
        /*jslint unparam:true*/
        if (i < numSelected / 2) {
          maxLeftTextWidth = Math.max(maxLeftTextWidth, this.getBBox().width);
        } else {
          maxRightTextWidth = Math.max(maxRightTextWidth, this.getBBox().width);
        }
      });

    if (boundingBox.x1 + svgMargins.left < maxLeftTextWidth + 20) { leftDisplay = false; }
    if (scales.x.range()[1] - boundingBox.x2 + svgMargins.right < maxRightTextWidth + 20) { rightDisplay = false; }

    // This makes sure that there is no overflow of labels of the page. In case of overflow only the points with
    // the heighest contributions are shown.
    numColumns = leftDisplay + rightDisplay;
    numSelected = Math.min(numSelected, Math.floor((plotHeight / textHeight) * numColumns));

    if (numSelected !== group.size()) {
      group = group.filter(function (d, i) {
        /*jslint unparam:true*/
        var self;

        if (i === numSelected - 1) {
          self = d3.select(this);
          self.select("text").text("(Too many labels)");
          self.select("line").style("visibility", "hidden");
        }
        return i < numSelected;
      });
    }

    group.style("visibility", "visible");

    if (leftDisplay && rightDisplay) {
      leftGroup = group.filter(function (d, i) {
        /*jslint unparam:true*/
        return i < numSelected / 2;
      });
      rightGroup = group.filter(function (d, i) {
        /*jslint unparam:true*/
        return i >= numSelected / 2;
      });
    } else if (leftDisplay) {
      leftGroup = group;
      rightGroup = group.filter(function () { return false; });
      maxLeftTextWidth = Math.max(maxLeftTextWidth, maxRightTextWidth);
    } else if (rightDisplay) {
      rightGroup = group;
      leftGroup = group.filter(function () { return false; });
      maxRightTextWidth = Math.max(maxLeftTextWidth, maxRightTextWidth);
    } else {
      return;
    }

    render.labelColumn(leftGroup,
      boundingBox.x1 - maxLeftTextWidth - 20, focusY, boundingBox.x1 + 2 - 20,
      maxLeftTextWidth + 2, textHeight, scales);
    render.labelColumn(rightGroup,
      boundingBox.x2 + 20, focusY, boundingBox.x2 + 20,
      maxRightTextWidth + 2, textHeight, scales);
  };

  render.origin = function (svg, scales) {
    var gPoints = svg.select("g"),
      lines = origin.visible ? [
        { // Horizontal line
          x1: scales.x(0) - (origin.size / 2),
          y1: scales.y(0),
          x2: scales.x(0) + (origin.size / 2),
          y2: scales.y(0)
        },
        { // Vertical line
          x1: scales.x(0),
          y1: scales.y(0) - (origin.size / 2),
          x2: scales.x(0),
          y2: scales.y(0) + (origin.size / 2)
        }
      ] : [],
      originLines = gPoints.selectAll("line.origin").data(lines);

    originLines.enter().append("line").attr("class", "origin");
    originLines
      .transition()
      .duration(1500)
      .attr("x1", function (d) { return d.x1; })
      .attr("y1", function (d) { return d.y1; })
      .attr("x2", function (d) { return d.x2; })
      .attr("y2", function (d) { return d.y2; });
    originLines.exit().remove();
  };

  sp.width = function (_) {
    if (!arguments.length) {return size.width; }
    size.width = _;
    return sp;
  };

  sp.height = function (_) {
    if (!arguments.length) {return size.height; }
    size.height = _;
    return sp;
  };

  sp.originVisible = function (_) {
    if (!arguments.length) {return origin.visible; }
    origin.visible = _;
    return sp;
  };

  sp.originSize = function (_) {
    if (!arguments.length) {return origin.size; }
    origin.size = _;
    return sp;
  };

  d3.rebind(sp, events, "on");
  return sp;
};
