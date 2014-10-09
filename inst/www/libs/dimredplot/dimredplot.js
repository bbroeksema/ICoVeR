var crpgl = crpgl || {};

crpgl.DimRedPlot = function() {
  var size = { width: 500, height: 500 },
      margins = { top: 15, bottom: 15, left: 15, right: 15 },
      parts = {
        variance: { width: .2 }, // width is in percentage
        scatterplot: {
          origin: { size: 25, visible: true },
        }
      },
      // The data properties to read for x, y and the contributions.
      properties = {
        x: "factor.1", y: "factor.2", 
        cx: "contrib.1", cy: "contrib.2"
      },
      scales = { 
        x: d3.scale.linear(),
        y: d3.scale.linear(),
        cx: d3.scale.linear(),
        cy: d3.scale.linear()
      },
      render = {},
      events = d3.dispatch.apply(this, ["rotate"]);

  function prop(name) {
    return function(x) {
      return x[name];
    }
  }

  function scaleProp(scale, name) {
    return function(d) {
      return scale(d[name]);
    }
  }

  function updateScales(data) {
    var domain, range;  // output range

    // Update the x scale
    domain = d3.extent(data, prop(properties.x)), // input domain
    range = [size.width * parts.variance.width + margins.left, size.width - margins.right];  // output range
    scales.x.domain(domain).range(range);

    // Update the y scale
    domain = d3.extent(data, prop(properties.y));
    range = [size.height - margins.top, 0 + margins.bottom];
    scales.y.domain(domain).range(range);

    // Update the cx scale
    domain = d3.extent(data, prop(properties.cx));
    range = [2, 10]; // A point is at least 2 and max 10 pixels wide.
    scales.cx.domain(domain).range(range);

    // Update the cy scale
    domain = d3.extent(data, prop(properties.cy));
    range = [2, 10]; // A point is at least 2 and max 10 pixels high.
    scales.cy.domain(domain).range(range);
  }

  render.init = function(svg) {
    // Add any elements here, that need to be added the first time the plot is
    // rendered.
    var svgEnter = svg.enter().append("svg"),
        gOutline = svgEnter.append("g"),
        gVariances = svgEnter.append("g"),
        gPoints = svgEnter.append("g");
    
    svgEnter.attr("class", "dimredplot");
    gOutline.append("rect").attr("class", "outline");
    gVariances.attr("class", "variances");
    gPoints.attr("class", "points");
  };

  render.resize = function(svg) {
    svg
      .attr("width", size.width)
      .attr("height", size.height);
  };

  // Variances is a vertical barplot which takes full height. It is located on
  // the left of the overall plot.
  render.variances = function(svg, variances, actives) {
    var gVariances = svg.select("g.variances"),
        barOrigin = Math.floor(size.width * parts.variance.width),
        barWidth = d3.scale.linear(),
        barHeight = size.height / variances.length,
        rect,
        scroll = d3.behavior.zoom(),
        direction = scroll.scale();

     scroll
      .translate([1, 1])
      .on("zoom", function() {
        events.rotate(drp, scroll.scale() > direction ? "up" : "down");
        direction = scroll.scale();
      });

    barWidth
      .domain(d3.extent(variances))
      .range([0, Math.floor(size.width * parts.variance.width)]);

    //  First we add bars which take full width for highlight purposes.
    rect = gVariances.selectAll(".variances .bg").data([variances]);
    rect.enter().append("rect").attr("class", "bg");
    rect
      .attr("x", 1)
      .attr("y", 1)
      .attr("width", barOrigin)
      .attr("height", size.height - 2)
      .call(scroll);

    //  Next, we add bars which that represent the actual variances.
    rect = gVariances.selectAll("rect.variance").data(variances)
    rect.enter().append("rect")
      .attr("height", barHeight);
    rect
      .attr("x", function(d) { return barOrigin - barWidth(d); })
      .attr("y", function(d, i) { return i * barHeight; })
      .attr("width", function(d) { return barWidth(d); })
      .attr("class", function(d, i) {
        // factors (and contributions) are numbered starting from 1.
        return actives.indexOf(i + 1) !== -1
          ? "variance active"
          : "variance";
      });
    rect.exit().remove();
  };

  render.points = function(svg, points) {
    var gPoints = svg.select("g.points"),
        rect = gPoints.selectAll("rect").data(points);

    // Points width and height are based on their contributions to their
    // respective principal axes. Contributions help locating the the variables
    // important for a given principal axes. As a rule of the tumb, points with
    // a contribution larger than the average contribute (1/numberOfVars) are
    // considered the important ones.

    rect.enter().append("rect");
    rect.exit().remove();
    rect
      .transition()
      .duration(1500)
      .attr("x", scaleProp(scales.x, properties.x)) // TODO: Adjust by 1/2 point width
      .attr("y", scaleProp(scales.y, properties.y)) // TODO: Adjust by 1/2 point height
      .attr("width", scaleProp(scales.cx, properties.cx))
      .attr("height", scaleProp(scales.cy, properties.cy))
      .attr("class", "point");
  };

  render.outline = function(svg) {
    var rect = svg.select(".outline");
    rect
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", size.width)
      .attr("height", size.height);
  };

  render.origin = function(svg) {
    var gPoints = svg.select("g.points"),
        origin = parts.scatterplot.origin,
        lines = origin.visible ? [
          { // Horizontal line
            x1: scales.x(0) - (origin.size / 2), y1: scales.y(0),
            x2: scales.x(0) + (origin.size / 2), y2: scales.y(0),
          },
          { // Vertical line
            x1: scales.x(0), y1: scales.y(0) - (origin.size / 2),
            x2: scales.x(0), y2: scales.y(0) + (origin.size / 2),
          },
        ] : [],
        originLines = gPoints.selectAll("line.origin").data(lines);

    originLines.enter().append("line").attr("class", "origin");
    originLines
      .transition()
      .duration(1500)
      .attr("x1", prop("x1"))
      .attr("y1", prop("y1"))
      .attr("x2", prop("x2"))
      .attr("y2", prop("y2"));
    originLines.exit().remove();
  }

  function drp(selection) {
    var svg;
    selection.each(function(data) {

      if (!data) return;
      if (!data.actives) throw("DimRedPlot expects an 'actives' property on the data");
      if (!data.actives.length === 2) throw("DimRedPlot expects an 'actives' to have a length of 2")
      if (!data.explainedVariance) throw("DimRedPlot expects an 'explainedVariance' property on the data");

      svg = d3.select(this).selectAll("svg").data([data]);
      render.init(svg);
      render.resize(svg);
      render.outline(svg);
      render.variances(svg, data.explainedVariance, data.actives);

      properties.x = "factor." + data.actives[0];
      properties.y = "factor." + data.actives[1];
      properties.cx = "contrib." + data.actives[0];
      properties.cy = "contrib." + data.actives[1];
      updateScales(data.projections);
      render.points(svg, data.projections);
      render.origin(svg);
    });
  }

  drp.margins = function(_) {
    if (!arguments.length) return margins;
    
    if (_.top) marings.top = _.top;
    if (_.bottom) marings.top = _.bottom;
    if (_.left) marings.top = _.left;
    if (_.right) marings.top = _.right;
    return drp;
  }

  drp.width = function(_) {
    if (!arguments.length) return size.width;
    size.width = _;
    return drp;
  };

  drp.height = function(_) {
    if (!arguments.length) return size.height;
    size.height = _;
    return drp;
  };

  drp.originVisible = function(_) {
    if (!arguments.length) return parts.scatterplot.origin.visible;
    parts.scatterplot.origin.visible = _;
    return drp;
  };

  drp.originSize = function(_) {
    if (!arguments.length) return parts.scatterplot.origin.size;
    parts.scatterplot.origin.size = _;
    return drp;
  };

  d3.rebind(drp, events, "on");
  return drp;
}