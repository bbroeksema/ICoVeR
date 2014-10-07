var crpgl = crpgl || {};

crpgl.DimRedPlot = function() {
  var size = { width: 500, height: 500 },
      margins = { top: 15, bottom: 15, left: 15, right: 15 },
      scales = { 
        x: d3.scale.linear(),
        y: d3.scale.linear(),
        cx: d3.scale.linear(),
        cy: d3.scale.linear()
      },
      render = {};
    
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
    var domain = d3.extent(data, prop("projection.x")), // input domain
        range = [0 + margins.left, size.width - margins.right];  // output range
    
    // Update the x scale
    scales.x.domain(domain).range(range);

    // Update the y scale
    domain = d3.extent(data, prop("projection.y"));
    range = [size.height - margins.top, 0 + margins.bottom];
    scales.y.domain(domain).range(range);

    // Update the cx scale
    domain = d3.extent(data, prop("contrib.x"));
    range = [2, 10]; // A point is at least 2 and max 10 pixels wide.
    scales.cx.domain(domain).range(range);

    // Update the cy scale
    domain = d3.extent(data, prop("contrib.y"));
    range = [2, 10]; // A point is at least 2 and max 10 pixels high.
    scales.cy.domain(domain).range(range);
  }
  
  render.init = function(svg) {
    // Add any elements here, that need to be added the first time the plot is
    // rendered.
    var svgEnter = svg.enter().append("svg"),
        gOutline = svgEnter.append("g"),
        gPoints = svgEnter.append("g");
    
    svgEnter.attr("class", "dimredplot");
    gOutline.append("rect").attr("class", "outline");
    gPoints.attr("class", "points");
  };
  
  render.resize = function(svg) {
    svg
      .attr("width", size.width)
      .attr("height", size.height);
  };
  
  render.points = function(svg, points) {
    var gPoints = svg.select("g.points"),
        rect = gPoints.selectAll("rect").data(points);
    
    rect.enter().append("rect");
    rect.exit().remove();
    rect
      .attr("x", scaleProp(scales.x, "projection.x")) // TODO: Adjust by 1/2 point width
      .attr("y", scaleProp(scales.y, "projection.y")) // TODO: Adjust by 1/2 point height
      .attr("width", scaleProp(scales.cx, "contrib.x"))
      .attr("height", scaleProp(scales.cy, "contrib.y"))
      .attr("class", "point");
  }

  render.outline = function(svg) {
    var rect = svg.select(".outline");
    rect
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", size.width)
      .attr("height", size.height);
  };

  function drp(selection) {
    var svg;
    selection.each(function(data) {
      if (!data) return;

      updateScales(data);
      svg = d3.select(this).selectAll("svg").data([data]);
      render.init(svg);
      render.resize(svg);
      render.outline(svg);
      render.points(svg, data);
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
  }

  return drp;
}