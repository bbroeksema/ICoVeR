


function ScatterPlot(parent_element_identifier){
  var width = 600,
  height = 600,
  alpha=0.9,
  data = null,
  quadtree = null, // quadtree structure used to cull off screen points from drawing and speed up selection
  x_transform = null,
  y_transform = null,
  radius = 5,
  selected = [], // items which have been currently selected by brushing or an external linked selection
  colorPalette = [], // used to provide a palette by which nodes can be colored
  extents = [[0,0],[1,1]], // extents are recalculated ( or copied from data, if defined) when data is loaded
  x_axis_label = "",
  y_axis_label = "",
  title = "",
  displayItems = [], // stores a list on on screen points to be actually drawn
  eventDispatcher = null,
  parent_element_id = "";

  parent_element_id = parent_element_identifier;

  InitialiseScatterPlot(); // set up the placehoder elements and size and width etc
  function scatter_plot() {
    // this function actuall creates the Scatterplot

  }
  scatter_plot.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    InitialiseScatterPlot(); // set up the placehloder elements and size and width etc
    return scatter_plot;

  };
  scatter_plot.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    InitialiseScatterPlot(); // set up the placeholder elements and size and width etc
    return scatter_plot;
  };

  scatter_plot.alpha = function(value) {
    if (!arguments.length) return alpha;
    alpha = value;
    drawCanvas();
    return scatter_plot;
  };

  scatter_plot.data = function(dataSet) {
    if (!arguments.length) return data;
    data = dataSet;
    InitialiseScatterplotData();
    return scatter_plot;
  };
  scatter_plot.eventDispatcher = function(dispatcher) {
    if (!arguments.length) return eventDispatcher;
    eventDispatcher = dispatcher;

    return scatter_plot;
  };

  function InitialiseScatterplotData() {

    radius = 5;
    selected = [];

    //initially draw all data items
    if(! data.dataItems) {
      if(data instanceof Array ){
        data.dataItems = data;
      }
    }
    displayItems = data.dataItems;

    if(!data.dataExtents) {
      // if extents are not defined in the input file we calculate them
      extents = [[data.dataItems[0].x,data.dataItems[0].y],[data.dataItems[0].x,data.dataItems[0].y]];
      // adding a boundary of 10% of largest of width and height
      data.dataItems.forEach(function (p) {
        if(p.x < extents[0][0] ) extents[0][0] = p.x;
        if(p.y < extents[0][1] ) extents[0][1]  = p.y;
        if(p.x > extents[1][0] ) extents[1][0] = p.x;
        if(p.y > extents[1][1] ) extents[1][1]  = p.y;
      });

      // adding a boundary of 10% of largest of width and height
      var boundary = d3.max([extents[1][0] - extents[0][0], extents[1][1] - extents[0][1]]) *0.1;
      extents[0][0] -= boundary;
      extents[0][1] -= boundary;
      extents[1][0] += boundary;
      extents[1][1] += boundary;
      //data.dataExtents = dataExtents;
    }else{
      // make a copy of the extents array and store it locally
      extents = []
      data.dataExtents.forEach(function(e) {
        extents.push(e.slice());
      });
    }
    data.dataItems.forEach(function (p) {
      p.selected=false;
      p.draw = true;
    });

    if(!data.title) {title = "";}
    if(!data.x_axis_label) {x_axis_label = "";};
    if(!data.y_axis_label) {y_axis_label = "";};




    setDataItemColours( colorPalette );
    x_transform = d3.scale.linear()
    .domain([extents[0][0],extents[1][0]])
    .range([ 0, width ]);
    y_transform = d3.scale.linear()
    .domain([extents[0][1],extents[1][1]])
    .range([ 0, height ]);
  }
  function drawCanvas() {
    var canvas =  d3.select("#scatter_canvas");

    var context = canvas.node().getContext('2d');

    // clearing previously drawn data
    context.clearRect(0,0,width,height );
    context.globalAlpha = 1.0
    // drawing x and y = 0 axes
    var x_axis_height = y_transform(0);
    if( x_axis_height > 0 && x_axis_height < height){
      context.lineWidth = 3;
      context.strokeStyle="#999999";
      context.beginPath();
      context.moveTo(0,x_axis_height);
      context.lineTo(width,x_axis_height);
      context.stroke();
    }
    var y_axis_height = x_transform(0);
    if( y_axis_height > 0 && y_axis_height < width){
      context.lineWidth = 3;
      context.strokeStyle="#999999";
      context.beginPath();
      context.moveTo(y_axis_height,0);
      context.lineTo(y_axis_height,height);
      context.stroke();
    }

    // Drawing data items
    context.lineWidth = 3;
    if(selected.length > 0) {
      context.globalAlpha = alpha * 0.2;
    }else {
      context.globalAlpha=alpha;
    }
    displayItems.forEach(function (p) {
      if(!p.selected && p.draw) {
        context.beginPath();
        context.arc(x_transform(p.x) , y_transform(p.y) , radius, 0, 2 * Math.PI, false);
        context.fillStyle = p.color;
        context.fill();
        context.closePath();
      }
    });


    if(selected.length >0) {
      context.globalAlpha= d3.min([alpha * 1.2, 1.0]) ;
    }
    displayItems.forEach(function (p) {
      if(p.selected && p.draw) {
        context.beginPath();
        context.arc(x_transform(p.x) , y_transform(p.y) , radius, 0, 2 * Math.PI, false);
        context.fillStyle = d3.rgb(p.color).brighter();
        context.fill();
        context.closePath();
      }
    });
  }
  scatter_plot.drawQuadTree = function() {
    // we need to use the data structure to correctly call the
    // quad tree for drawing
    var parent = d3.select(parent_element_id);
    var svg =  parent.select("#scatter_svg_overlay");
    var quadTreeNodes = allQuadTreeNodes();
    svg.selectAll(".scatternode").remove();
    var rect = svg.selectAll(".scatternode")
    .data(quadTreeNodes)
    .enter().append("rect")
    .attr("class", "node")
    .attr("x", function(d) { return   x_transform(d.x1); })
    .attr("y", function(d) { return y_transform(d.y1); })
    .attr("width", function(d) { return x_transform(d.x2) - x_transform(d.x1); })
    .attr("height", function(d) { return  y_transform(d.y2) - y_transform(d.y1); });
  }

  function allQuadTreeNodes() {
    var nodes = [];
    quadtree.visit(function(node, x1, y1, x2, y2) {
      nodes.push({x1: x1, y1: y1, x2: x2,  y2: y2});
    });
    return nodes;
  }

  function searchQuadtree( x0, y0, x3, y3) {
    var nodes =[];
    quadtree.visit(function(node, x1, y1, x2, y2) {
      var p = node.point;
      if (p) {
        //p.scanned = true;
        if((p.x >= x0) && (p.x < x3) && (p.y >= y0) && (p.y< y3)) {
          nodes.push(p);
        }
      }
      return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });
    return nodes;
  }

  function GetStringPxWidth(in_string)
  {
    var parent = d3.select(parent_element_id);
    var svg = parent.select("#scatter_svg_overlay");
    var text = svg.append("svg:text")
    .attr("x", 480)
    .attr("y", 250)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("class", "scatterplot_tootip")
    .text(in_string);

    var bbox = text.node().getBBox();
    var width = bbox.width;
    text.remove();
    return width;
  }

  function getToolTip(mouse_context) {
    // find node
    //within 10 pixels of mouse
    var parent = d3.select(parent_element_id);
    var svg =  parent.select("#scatter_svg_overlay");
    d3.select("#tooltip_div").remove();
    pos= d3.mouse(mouse_context);
    // find the node
    var nodes = searchQuadtree(x_transform.invert(pos[0]- radius),y_transform.invert(pos[1]-radius),
        x_transform.invert(pos[0]+radius) ,y_transform.invert(pos[1]+radius));
    if(nodes.length < 1) {
      return;
    }
    //getting the id of the placeholder node ( which is the parent of the svg node)
    var parentNodeId = d3.select("#scatter_svg_overlay").node().parentNode.id;
    var t_div = d3.select("#" + parentNodeId).append("div")
    .attr("id", "tooltip_div")
    .attr("class", "scattertooltip")
    .style("opacity", 1e-6);

    var display_text = nodes[0].name + "\n x:" + nodes[0].x.toFixed(4) + "\n y:"+ nodes[0].y.toFixed(4);
    t_div.text(display_text );
    // get width of largest line element in tooltip text
    // line will wrap at the nearest space
    var text_width = 0;
    var lines = display_text.toString().split('\n');
    lines.forEach(function(d) {
      text_width = d3.max([text_width,GetStringPxWidth(d) + 10]);
    });
    t_div.style("left", (pos[0] + 0) + "px");
    t_div.style("top", ( pos[1] + 0) + "px");
    t_div.style("width", parseInt(text_width) + "px");
    t_div.style("height", lines.length *12 + "px");
    t_div.transition()
    .duration(500)
    .style("opacity", 0.8);
  }
  //End tooltip functionality
  scatter_plot.draw = function() {
    var parent = d3.select(parent_element_id);
    var svg =  parent.select("#scatter_svg_overlay");


    drawAxes();

    //building the quadtree
    quadtree = d3.geom.quadtree()
    .extent(extents)
    .x(function(d) {return d.x;})
    .y(function(d) { return d.y;})
    (data.dataItems);
    var svg_zoom_behaviour = d3.behavior.zoom().x(x_transform).y(y_transform).scaleExtent([1, 20]).on("zoom", zoom);
    svg.call( svg_zoom_behaviour);

    // start interaction functionality (pan, zoom, brushes)
    var brush = d3.svg.brush()
    .x(x_transform)
    .y(y_transform)
    .extent([[0, 0], [0, 0]])
    .on("brush", brushed);

    var polyBrush = d3.svg.polybrush()
    .x(x_transform)
    .y(y_transform)
    .parentSelection(svg);

    function brushed() {
      var extent = brush.extent();
      //point.each(function(d) { d.scanned = d.selected = false; });
      selected = searchQuadtree( extent[0][0], extent[0][1], extent[1][0], extent[1][1]);
      selected.forEach(function(d) {
        d.selected=true;
      });

      eventDispatcher.cascatterbrushed( { 'items':  selected });

    }
    function zoom() {
      // onlx want to search in the quadtree within its boutns
      // so if screen extents are outside the quadtree adjust them to match it
      var x_min= d3.max([x_transform.invert(0),extents[0][0] ]);
      var y_min = d3.max([y_transform.invert(0),extents[0][1] ]);
      var x_max  = d3.min([x_transform.invert(width), extents[1][0]]);
      var y_max  = d3.min([y_transform.invert(height) , extents[1][1]]);
      displayItems = searchQuadtree( x_min, y_min, x_max, y_max);
      drawAxes();
      drawCanvas();
    }

    function polybrushed() {
      //  set the 'selected' class for the circle
      selected.forEach(function(d) { d.selected=false;});
      polyBrush.parentSelection(svg);
      var polyBrushExtents = polyBrush.extent();
      if(polyBrushExtents.length <1 ) {
        // nothing has been selected
        return;
      }
      var scaledPolyBrushExtents = [[polyBrushExtents[0][0],polyBrushExtents[0][1]],
                                    [polyBrushExtents[0][0],polyBrushExtents[0][1]]];

      // the supplied extents are actually an array of the corner points of the poygon
      // we will make a rectangular bounding area using  the max and min values for x and y ,across all the bounding area points
      for(var i = 1; i < polyBrushExtents.length; i++) {
        if(polyBrushExtents[i][0] < scaledPolyBrushExtents[0][0]) scaledPolyBrushExtents[0][0] = polyBrushExtents[i][0];
        else if(polyBrushExtents[i][0] > scaledPolyBrushExtents[1][0]) scaledPolyBrushExtents[1][0] = polyBrushExtents[i][0];
        if(polyBrushExtents[i][1] < scaledPolyBrushExtents[0][1]) scaledPolyBrushExtents[0][1] = polyBrushExtents[i][1];
        else if(polyBrushExtents[i][1] > scaledPolyBrushExtents[1][1]) scaledPolyBrushExtents[1][1] = polyBrushExtents[i][1];
      }
      // convert extents to the correct scale
      scaledPolyBrushExtents[0][0] = x_transform.invert(scaledPolyBrushExtents[0][0]);
      scaledPolyBrushExtents[0][1] = y_transform.invert(scaledPolyBrushExtents[0][1]);
      scaledPolyBrushExtents[1][0] = x_transform.invert(scaledPolyBrushExtents[1][0]);
      scaledPolyBrushExtents[1][1] = y_transform.invert(scaledPolyBrushExtents[1][1]);
      selected = [];

      // unlike reqular brush extents polybrushExtents are not scaled
      // so we scale them here
      var extentNodes = searchQuadtree( scaledPolyBrushExtents[0][0], scaledPolyBrushExtents[0][1],
          scaledPolyBrushExtents[1][0], scaledPolyBrushExtents[1][1]);
      // extent nodes contains all node in the rectangular area bounding the polybrush, we need to check if each item is actually contained
      extentNodes.forEach(function(n) {
        if (polyBrush.isWithinExtent(x_transform(n.x), y_transform(n.y))) {
          selected.push(n);
          n.selected=true;
        }
      });
      eventDispatcher.cascatterbrushed( { 'items':  selected });


    }
    // end interaction functionality (pan, zoom, brushes)

    //draw the scatterplot
    drawCanvas();

    // start mouse / keyboard interaction functionality
    var mouseIsDown = false;
    var ctrlIsDown = false;
    var lShiftDown = false;
    // when ctrl is pressed the user is selecting and not panning with the drag
    // however the translation vector  for the zoom/pan behaviour is still being updated
    // so we need to store it when ctrl is  pressed
    // and set it with the stored value when ctrl is realised
    // to avoid a jump when panning after a drag select
    var ctrlDownStartTranslation;
    // scale copies are used  when a drag select is started.
    // to prevent the scales being used by the zoom being updated by the selection operation
    var x_scale_copy;
    var y_scale_copy;


    svg.on("click", function(){ getToolTip(this);})
    d3.select("body").on("keydown", function(d) {
      var selectEvent; // used to notify any listeners that items have been slected
      if (d3.event.keyCode == 17) {
        if(!ctrlIsDown){
          selected.forEach(function(d) {
            d.selected=false;
          });
          selected = [];
          ctrlIsDown = true;

          // holding ctrl down activates the rectangular brush for selection
          // when selceting an area the mouse will be dragged
          // This dragging to select functionality should not affect the pan/zoom functionality
          // therfor we store the existing translate at start of drag that defines the sleection area
          svg.call(svg_zoom_behaviour.on("zoom", null));
          x_scale_copy = x_transform.copy();
          y_scale_copy = y_transform.copy();
          // save current translation so it can be reinstated after the drag
          ctrlDownStartTranslation = svg_zoom_behaviour.translate();
          // disable zoom while CTRL is pressed

          brush = d3.svg.brush()
          .x(x_scale_copy)
          .y(y_scale_copy)
          .extent([[0, 0], [0, 0]])
          .on("brushend", brushed);
          svg.append("g")
          .attr("class", "brush")
          .call(brush);
        }
      } else if (d3.event.keyCode == 16) {
        if(!lShiftDown){
          lShiftDown = true;
          // left shift is use to enter polybrsuh mode
          selected.forEach(function(d) { d.selected=false;});
          selected = [];
          // when using the polybrush we also want to disable the pan zoom functionality
          // as we did for the rectangualar brush
          svg.call(svg_zoom_behaviour.on("zoom", null));
          x_scale_copy = x_transform.copy();
          y_scale_copy = y_transform.copy();
          // save current translation so it can be reinstated after the polybrush selection
          ctrlDownStartTranslation = svg_zoom_behaviour.translate();

          polyBrush = d3.svg.polybrush()
          .x(x_scale_copy)
          .y(y_scale_copy)
          .on("brushend", polybrushed);
          svg.append("svg:g")
          .attr("class", "pbrush")
          .call(polyBrush);
        }
      }
    });
    d3.select("body").on("keyup", function(d) {
      if(d3.event.keyCode == 17) {
        // Finished selection with rectangular brush
        ctrlIsDown = false;

        // restore translation that existing at the start of the drag
        svg_zoom_behaviour.translate(ctrlDownStartTranslation);
        svg.select(".brush").remove();
        brush.extent([0,0],[0,0]);
        svg.call( svg_zoom_behaviour.on("zoom", zoom));
        drawCanvas();
      }else if(d3.event.keyCode == 16) {
        // Finished selection with polybrush
        lShiftDown = false;
        polyBrush.closePath();
        // restore translation that existing at the start of the drag
        svg_zoom_behaviour.translate(ctrlDownStartTranslation);
        svg.select(".pbrush").remove();
        polyBrush.extent([0,0],[0,0]);
        svg.call( svg_zoom_behaviour.on("zoom", zoom));
        polyBrush.on("brush", null);
        drawCanvas();
      }
    });
    //end mouse / keyboard interaction functionality
  }

  function drawAxes( ) {
    var parent = d3.select(parent_element_id);
    var svg = parent.select("#scatter_svg_overlay");
    if(!svg) {
      console.log("Cannot draw Axes. Scatterplot has not been initialised");
      return;
    }
    var canvas =  parent.select("#scatter_canvas");
    svg.selectAll("g").remove();

    // create initial transforms to map full data set
    // to the display space
    // we need to create c stom scale for the axes
    // as we do not want axes to traverse full width of screen
    x_axis_transform = x_transform.copy();
    y_axis_transform = y_transform.copy();
    var xAxis = d3.svg.axis()
    .scale(x_axis_transform)
    .orient("bottom")
    .ticks(5);
    var yAxis = d3.svg.axis()
    .scale(y_axis_transform)
    .orient("left")
    .ticks(5);

    // draw x axis
    svg.append("g")
    .attr("class", "axis")
    //.attr("width",width)
    .attr("transform", "translate(0," + (height - 20)  +")")
    .call(xAxis)
    .append("text")
    .style("text-anchor", "end")
    .attr("y", -10)
    .attr("x",width -(15))
    .text(x_axis_label);

    //draw y axis
    svg.append("g")
    .attr("class", "axis")
    //.attr("height", height - 100)
    .attr("transform", "translate("+ 30 +",0)")
    .call(yAxis)
    .append("text")
    .style("text-anchor", "start")
    .attr("x", 10)
    .attr("y", 20)
    .text(y_axis_label);

    //draw title if it exists
    if(title.length > 0) {
      svg.append("g").append("text")
      .style("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", 20)
      .text(title);
    }

    var canvas_style  = canvas.node().style;
    canvas_style.position = "absolute";
    canvas_style.left =  "0px" ;
    canvas_style.top =  "0px";
    var svg_style = svg.node().style;
    svg_style.position = "absolute";
    svg_style.left = 0;
    svg_style.top = 0;

  }

  function setDataItemColours (palette) {
    var color_hash = {};
    var current_color_index = 0;
    data.dataItems.forEach(function(d) {
      // if data Item  type not found add it to has
      if(!color_hash.hasOwnProperty(d.type)) {
        color_hash[d.type] = palette[current_color_index];
        current_color_index = (current_color_index +1) % palette.length;
      }

      d.color = color_hash[d.type];
    });

  }

  scatter_plot.colorNodeByName = function(colormap, nameVariable) {
    data.dataItems.forEach(function (d) {

      if(colormap.hasOwnProperty(d[nameVariable])) {
        d.color = colormap[d[nameVariable]];
      }
    });

    drawCanvas();
    return scatter_plot;
  }
  scatter_plot.filterItems = function(fieldName, fieldValue) {
    if(!fieldName || !fieldValue) {
      data.dataItems.forEach(function(d){
        d.draw =true;
      });
      return;
    }

    data.dataItems.forEach(function(d){
      if(d.hasOwnProperty(fieldName)) {
        if(d[fieldName] === fieldValue) {
          d.draw =true;
        }
        else {
          d.draw=false;
        }
      }
    });
    drawCanvas();
  }
  function InitialiseScatterPlot() {
    // creates the svg and canvas elements used for rendering
    var parent_element =  d3.select(parent_element_id);
    var canvas=parent_element.select("#scatter_canvas");
    var svg = parent_element.select("#scatter_svg_overlay");
    if( parent_element) {
      if(canvas.empty()) {
        canvas= parent_element.append("canvas") .attr("id", "scatter_canvas");
      }
      if(svg.empty()) {
        svg = parent_element.append("svg").attr("id", "scatter_svg_overlay");
      }
    } else {
      console.log("Error : no place holder elemnt found for  Scatter Plot");
    }

    svg.attr("width", width)
    .attr("height", height);
    canvas.attr("width", width)
    .attr("height", height);

    // add an event to be dipacthed when brushed

    colorPalette = ["#8dd3c7","#069","#bebada","#fb8072","#ffffb3","#80b1d3"];
    if(!eventDispatcher) {
      eventDispatcher = d3.dispatch("cascatterbrushed");
    }
    x_transform = d3.scale.linear()
    .domain([extents[0][0],extents[1][0]])
    .range([ 0, width ]);
    y_transform = d3.scale.linear()
    .domain([extents[0][1],extents[1][1]])
    .range([ 0, height ]);

  }
  return scatter_plot;
}
