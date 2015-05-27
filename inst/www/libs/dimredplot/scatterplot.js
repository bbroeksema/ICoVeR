/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3*/

var list = this.list || {};

// Reusable D3 chart. This creates a scatterplot.  It creates the elements in a svg tag.
list.ScatterPlot = function () {
  "use strict";

  var size = { width: 500, height: 500 },
    svgMargins = { top: 20, bottom: 20, left: 35, right: 50 },
    pointMargin = 5,
    render = {},
    color = {
      colorFn: null,
      variableName: "contribution",
      variableValues: null,
      useColouring: false
    },
    pointSizeFn = null,
    events = d3.dispatch.apply(this, ["selectionEnd", "brushEnd"]),
    origin = { size: 25, visible: true};

  function xyContribution(d, data) {
    return (d.xContribution * data.xVariance + d.yContribution * data.yVariance) / (data.xVariance + data.yVariance);
  }

  function pointSizeFunction(value) {
    if (pointSizeFn === null) {
      return 4;
    }
    return pointSizeFn(value);
  }

  function pointExtentByContribution(data) {
    var maxContribution = -1000,
      maxDatum,
      minContribution = 1000,
      minDatum;

    data.points.forEach(function (d) {
      var contribution = xyContribution(d, data);
      if (contribution > maxContribution) {
        maxContribution = contribution;
        maxDatum = d;
      }
      if (contribution < minContribution) {
        minContribution = contribution;
        minDatum = d;
      }
    });

    return [minDatum, maxDatum];
  }

  function updateScales(data, scales) {
    var domain, range;  // output range

    // Update the colormap scale
    if (color.useColouring) {
      domain = d3.extent(data.points, function (d) { return color.variableValues[d.id]; });
    } else {
      domain = d3.extent(data.points, function (d) { return xyContribution(d, data); });
    }

    range = [size.height - svgMargins.top - svgMargins.bottom, 0];
    scales.colormap.domain(domain).range(range);

    // Update the color scale
    range = [0, 1];
    scales.color.domain(domain).range(range);

    // Make sure that none of the points overflow the plot space
    pointMargin = pointSizeFunction(pointExtentByContribution(data)[1]);

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

      if (color.colorFn !== null && color.variableValues !== null) {
        color.useColouring = true;
      } else if (color.colorFn !== null || color.variableValues !== null) {
        throw "If coloring is desired then both colorFunction and colorVariableValures have to be set";
      }

      updateScales(data, scales);

      if (data.flags.pointsChanged) {
        svg.selectAll("g.points")
          .attr("transform", "translate(" + svgMargins.left + ", " + svgMargins.top + ")");

        data.points.forEach(function (point) {
          point.hovered = false;
        });

        // The points are displayed from high contribution to low contribution
        sortedPoints = data.points.slice();
        sortedPoints.sort(function (d1, d2) {
          var d1Contribution = -xyContribution(d1, data),
            d2Contribution = -xyContribution(d2, data);

          if (d1Contribution < d2Contribution) {
            return -1;
          }
          if (d1Contribution > d2Contribution) {
            return 1;
          }
          return 0;
        });

        // Add the necessary elements
        render.resize(svg);
        render.title(svg, data.title);
        render.points(svg, data, scales);
        render.axes(svg, scales);

        render.origin(svg, scales);
        render.interactionOverlay(svg, data, scales, selectCircleRadius);
      }

      if (color.useColouring) {
        render.colormap(svg, data, scales);
        render.selectionOnColormap(svg, data, scales);
      } else if (pointSizeFn !== null) {
        render.sizemap(svg, data, scales);
        render.selectionOnSizemap(svg, data, scales);
        render.sizemapBrush(svg, data, scales);
      }

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
  render.points = function (svg, data, scales) {
    var gPoints = svg.select("g.points"),
      ellipse = gPoints.selectAll("g.point").data(data.points);

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
      .attr("rx", pointSizeFunction)
      .attr("ry", function (d) {
        return pointSizeFunction(d) / 4;
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
        if (color.useColouring) {
          render.selectionOnColormap(svg, data, scales);
        } else if (pointSizeFn !== null) {
          render.selectionOnSizemap(svg, data, scales);
        }
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
      .on("touchend.zoom", null)
      .on("dblclick.zoom", null);
  };

  render.sizemapBrush = function (svg, data, scales) {
    var gPoints = svg.select("g.points"),
      plotWidth = size.width - svgMargins.right - svgMargins.left,
      brush = d3.svg.brush(),
      brushGroup;

    function brushed() {
      var extent = brush.extent();

      data.brushExtent = extent;

      data.points.forEach(function (d) {
        var contribution = xyContribution(d, data);
        setNotSelected(d);

        if (contribution >= extent[0] && contribution <= extent[1]) {
          setSelected(d);
        }
      });
      render.colorPoints(svg, data, scales);
      render.selectionOnSizemap(svg, data, scales);
    }

    function brushEnd() {
      var selected = [];
      data.points.forEach(function (d) {
        selected.push(d.selected === list.selected.POINT || d.selected === list.selected.BOTH);
      });
      events.brushEnd(sp, selected, data.idx, brush.extent()[0], brush.extent()[1]);
    }

    brush
      .y(scales.colormap)
      .extent(data.brushExtent)
      .on("brush", brushed)
      .on("brushend", brushEnd);

    //  Render the brush
    brushGroup = gPoints.selectAll("g.brush").data([true]);
    brushGroup.enter().append("g").attr("class", "brush");
    brushGroup
      .call(brush);

    brushGroup.selectAll("rect")
      .attr("width", 20)
      .attr("x", plotWidth);
  };

  // Renders a colormap with scale on the right side of the plot
  render.sizemap = function (svg, data, scales) {
    var gPoints = svg.select("g.points"),
      plotWidth = size.width - svgMargins.right - svgMargins.left,
      plotHeight = size.height - svgMargins.top - svgMargins.bottom,
      axis,
      axisGroup,
      ellipses = [
        {
          y: 0,
          size: 0
        },
        {
          y: plotHeight,
          size: 0
        }
      ],
      lines = [-1, 1],
      pointExtent = pointExtentByContribution(data);

    ellipses[0].size = pointSizeFn(pointExtent[1]);
    ellipses[1].size = pointSizeFn(pointExtent[0]);

    axis = d3.svg.axis()
      .scale(scales.colormap)
      .orient("right");

    axisGroup = gPoints.selectAll("g.coloraxis").data([true]);
    axisGroup.enter()
      .append("g")
      .attr("class", "coloraxis");
    axisGroup
      .attr("transform", "translate(" + (plotWidth + 20 - 1) + ", 0)")
      .transition()
      .duration(1500)
      .call(axis);

    ellipses = gPoints.selectAll("ellipse.sizemap").data(ellipses);
    ellipses
      .enter()
      .append("ellipse")
      .attr("class", "sizemap");
    ellipses
      .transition()
      .duration(1500)
      .attr("rx", function (d) {
        return d.size;
      })
      .attr("ry", function (d) {
        return d.size / 4;
      })
      .attr("cx", plotWidth + 10)
      .attr("cy", function (d) {
        return d.y;
      })
      .style("fill", "grey");

    lines = gPoints.selectAll("line.sizemap").data(lines);
    lines
      .enter()
      .append("line")
      .attr("class", "sizemap");
    lines
      .transition()
      .duration(1500)
      .attr("x1", function (mult) {
        return plotWidth + 10 + mult * pointSizeFn(pointExtent[1]);
      })
      .attr("y1", 0)
      .attr("x2", function (mult) {
        return plotWidth + 10 + mult * pointSizeFn(pointExtent[0]);
      })
      .attr("y2", plotHeight)
      .style("stroke-width", "1px")
      .style("stroke", "gray");
  };

  render.selectionOnSizemap = function (svg, data, scales) {
    var gPoints = svg.select("g.points"),
      plotWidth = size.width - svgMargins.right - svgMargins.left,
      ellipses;

    ellipses = gPoints.selectAll("ellipse.selection").data(data.points);
    ellipses.enter()
      .append("ellipse")
      .attr("class", "selection")
      .attr("rx", function (d) {
        return pointSizeFn(d);
      })
      .attr("ry", function (d) {
        return pointSizeFn(d) / 4;
      })
      .attr("cx", plotWidth + 10)
      .attr("cy", function (d) {
        return scales.colormap(xyContribution(d, data));
      })
      .style("fill", "steelblue");

    ellipses
      .style("visibility", function (d) {
        return d.selected !== list.selected.NONE ? "visible" : "hidden";
      });
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
        var value = color.variableValues[d.id];
        setNotSelected(d);

        if (value >= extent[0] && value <= extent[1]) {
          setSelected(d);
        }
      });
      render.colorPoints(svg, data, scales);
      render.selectionOnColormap(svg, data, scales);
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
      .colourFunction(color.colorFn)
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
        return scales.colormap(color.variableValues[d.id]);
      })
      .attr("x2", plotWidth + 20 - 3)
      .attr("y2", function (d) {
        return scales.colormap(color.variableValues[d.id]);
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
  render.colorPoints = function (svg, data) {
    var colorMap = color.colorFn,
      points = svg.select("g.points").selectAll("ellipse.point"),
      isSelected = false;

    isSelected = data.brushExtent[0] !== data.brushExtent[1] || data.points.some(function (d) {
      return d.selected !== list.selected.NONE;
    });

    if (isSelected || data.isInfluenced) {
      points.style("fill", function (d, idx) {
        var pointColor = "steelblue",
          influence = data.points[idx].influence;

        if (color.useColouring) {
          pointColor = colorMap(color.variableValues[d.id]);
        }

        if (isSelected) {
          influence = 0;
        }

        if (data.points[idx].selected !== list.selected.NONE) {
          influence = 1;
        }

        // When selecting points it is not necessary to calculate the expensive interpolate function
        if (influence === 0) {
          return "rgb(230, 230, 230)";
        }
        if (influence === 1) {
          return pointColor;
        }
        return d3.interpolateHsl("rgb(255, 255, 255)", pointColor)(influence * 0.9 + 0.1);
      });
    } else {
      points.style("fill", function (d) {
        if (color.useColouring) {
          return colorMap(color.variableValues[d.id]);
        }
        return "steelblue";
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

  sp.pointSize = function (_) {
    if (!arguments.length) {return pointSizeFn; }
    pointSizeFn = _;
    return sp;
  };

  sp.colorVariableName = function (_) {
    if (!arguments.length) {return color.variableName; }
    color.variableName = _;
    return sp;
  };

  sp.colorVariableValues = function (_) {
    if (!arguments.length) {return color.variableValues; }
    color.variableValues = _;
    return sp;
  };

  sp.colorFunction = function (_) {
    if (!arguments.length) {return color.colorFn; }
    color.colorFn = _;
    return sp;
  };

  d3.rebind(sp, events, "on");
  return sp;
};
