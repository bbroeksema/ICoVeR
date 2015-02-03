var crpgl = crpgl || {};

crpgl.MapPlot = function() {

  var size = { width: 500, height: 500 },
      margins = { top: 15, bottom: 15, left: 15, right: 15 },
      // The data properties to read for x, y.
      properties = { x: "x", y: "y" },
      scales = { x: d3.scale.linear(), y: d3.scale.linear() };

  function drawItem(context) {
    var width = scales.x(1) - scales.x(0),
        height = scales.y(1) - scales.y(0);

    return function(d) {
      context.beginPath();
      context.fillRect(scales.x(d.x), scales.y(d.y), width, height);
    }
  }

  function mp(selection) {
    selection.each(function(data) {
      var canvas = d3.select(this).selectAll("canvas").data(["data", "highlight"]),
          context,
          render = data.render || { data: true, highlight: true },
          renderFn;

      canvas.enter().append("canvas").attr("id", function(d) { return d; });

      if (render.data) {
        canvas = d3.select(this).select("canvas#data");
        canvas
          .attr("width", size.width)
          .attr("height", size.height)
          .style("position", "absolute");
        context = canvas[0][0].getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#069';
        renderFn = drawItem(context);
        _.each(data, renderFn);
      }

      if (render.highlight) {
        canvas = d3.select(this).select("canvas#highlight");
        canvas
          .attr("width", size.width)
          .attr("height", size.height)
          .style("position", "absolute");
        context = canvas[0][0].getContext('2d');
        context.fillOpacity = 0;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        renderFn = drawItem(context);
        _.each(data.highlighted, renderFn);
      }
    });
  }

  mp.margins = function(_) {
    if (!arguments.length) return margins;

    if (_.top) marings.top = _.top;
    if (_.bottom) marings.top = _.bottom;
    if (_.left) marings.top = _.left;
    if (_.right) marings.top = _.right;
    return mp;
  }

  mp.width = function(_) {
    if (!arguments.length) return size.width;
    size.width = _;
    scales.x.range([0, _]);
    return mp;
  };

  mp.height = function(_) {
    if (!arguments.length) return size.height;
    size.height = _;
    scales.y.range([_, 0]);
    return mp;
  };

  mp.xDomain = function(_) {
    if (!arguments.length) return scales.x.domain();

    scales.x.domain(_);
    return mp;
  }

  mp.yDomain = function(_) {
    if (!arguments.length) return scales.y.domain();

    scales.y.domain(_);
    return mp;
  }

  return mp;
}
