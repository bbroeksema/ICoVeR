var crpgl = crpgl || {};

crpgl.DimRedPlot = function() {
  var size = { width: 500, height: 500 },
      margins = { top: 5, bottom: 5, left: 5, right: 5 },
      scales = { x: d3.scale.linear(),y: d3.scale.linear() },
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
    
    scales.x.domain(domain).range(range);
    
    domain = d3.extent(data, prop("projection.y"));
    range = [size.height - margins.top, 0 + margins.bottom];
    scales.y.domain(domain).range(range);
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
      .attr("x", scaleProp(scales.x, "projection.x"))
      .attr("y", scaleProp(scales.y, "projection.y"))
      .attr("width", 2)
      .attr("height", 2)
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