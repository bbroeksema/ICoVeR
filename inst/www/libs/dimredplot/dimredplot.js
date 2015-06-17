/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3*/

var list = this.list || {};

list.selected = {
  NONE: "none",
  BAR: "bar",
  POINT: "point",
  BOTH: "both"
};

list.selectByPoint = function (selections, point) {
  "use strict";
  var state = selections[point];

  if (state === list.selected.NONE) {
    selections[point] = list.selected.POINT;
  } else if (state === list.selected.BAR) {
    selections[point] = list.selected.BOTH;
  }
};

list.deselectByPoint = function (selections, point) {
  "use strict";
  var state = selections[point];

  if (state === list.selected.POINT) {
    selections[point] = list.selected.NONE;
  } else if (state === list.selected.BOTH) {
    selections[point] = list.selected.BAR;
  }
};

list.selectByBar = function (selections, point) {
  "use strict";
  var state = selections[point];

  if (state === list.selected.NONE) {
    selections[point] = list.selected.BAR;
  } else if (state === list.selected.POINT) {
    selections[point] = list.selected.BOTH;
  }
};

list.deselectByBar = function (selections, point) {
  "use strict";
  var state = selections[point];

  if (state === list.selected.BAR) {
    selections[point] = list.selected.NONE;
  } else if (state === list.selected.BOTH) {
    selections[point] = list.selected.POINT;
  }
};

list.arrayMax = function (arr) {
  "use strict";
  return Math.max.apply(null, arr);
};

list.arrayMin = function (arr) {
  "use strict";
  return Math.min.apply(null, arr);
};

list.arraySum = function (arr) {
  "use strict";
  var idx,
    arraySum = 0;

  for (idx = 0; idx !== arr.length; idx += 1) {
    arraySum += arr[idx];
  }

  return arraySum;
};

list.textSize = function (text, cssSize) {
  "use strict";
  var svg = d3.select("body").append("svg"),
    textElement = svg.append("text"),
    boundingBox;

  textElement
    .text(text)
    .style("font-size", cssSize);

  boundingBox = textElement.node().getBBox();

  svg.remove();

  return boundingBox;
};

list.addOrUpdate = function (parent, data, tagName, elementName) {
  "use strict";

  var element = parent.selectAll(elementName).data(data);
  element
    .enter()
    .append(tagName);

  return element;
};

list.DimRedPlot = function () {
  "use strict";

  var size = { width: 500, height: 500 },
    parts = {
      variancepercentage: {
        height: 0.05
      },
      scatterplot: {
        totalWidth: 0.80,
        width: {
          individual: 0.40,
          variable: 0.40
        },
        height: 0.95,
        origin: { size: 25, visible: true }
      },
      contributions: {
        width: 0.20,
        height: 0.95
      }
    },
    render = {},
    events = d3.dispatch.apply(this, ["changeVariableSelection", "changeIndividualSelection", "changeAxes"]),
    actives = {
      first: 0,
      second: 1,
      lastChanged: "first"
    },
    unifyAxesScaling = true,
    automaticResize = false,
    contributionBrushExtents,
    colormapBrushExtent = {},
    invertPlotOrder = false,
    plotOrderChanged = false,
    color = {
      colorFn: null,
      variableName: "contribution",
      variableValues: null
    },
    selections = {
      variable: {},
      individual: {}
    },
    influences = {
      variable: {},
      individual: {}
    };

  function resetContributionBrushExtents() {
    contributionBrushExtents = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0]
    ];
  }

  function resetColormapBrushExtent() {
    colormapBrushExtent.variable = [0, 0];
    colormapBrushExtent.individual = [0, 0];
  }

  resetContributionBrushExtents();
  resetColormapBrushExtent();

  function drp(selection) {
    var div;

    selection.each(function (data) {

      if (!data) {return; }
      if (!data.explainedVariance) {throw "DimRedPlot expects an 'explainedVariance' property on the data"; }

      div = d3.select(this).selectAll(".dimredplot-tooltip").data([true]);
      div
        .enter()
        .append("div")
        .attr("class", "dimredplot-tooltip")
        .append("strong");

      function setStates(type) {
        var projections = data[type + "Projections"];

        if (projections === undefined) {
          return;
        }

        projections.forEach(function (projection) {
          if (selections[type][projection.id] === undefined) {
            selections[type][projection.id] = list.selected.NONE;
            influences[type][projection.id] = 0;
          }
        });
      }

      setStates("variable");
      setStates("individual");

      div.selectAll("p").data([true]).enter().append("p");

      render.dimredplot(d3.select(this), data, {pointsChanged: true});

      div.exit().remove();
    });
  }

  render.dimredplot = function (div, data, flags) {
    // We reset the scatterplot width here. This way any rerendering of other elements
    // after this rerendering knows what the current scatterplot width is.
    parts.scatterplot.width.individual = parts.scatterplot.totalWidth / 2;
    parts.scatterplot.width.variable = parts.scatterplot.totalWidth / 2;

    render.variancePercentageBar(div, data);

    if (plotOrderChanged) {
      div.selectAll("div.scatterplot, div.barplots").remove();

      plotOrderChanged = false;
    }

    if (invertPlotOrder) {
      render.contributions(div, data);
      render.scatterplots(div, data, flags);
    } else {
      render.scatterplots(div, data, flags);
      render.contributions(div, data);
    }
  };

  render.scatterplots = function (div, data, flags) {
    var individualsPresent = data.individualProjections !== undefined,
      variablesPresent = data.variableProjections !== undefined,
      status = {
        variable: {
          isSelected: false,
          isInfluenced: false
        },
        individual: {
          isSelected: false,
          isInfluenced: false
        }
      };

    function checkStatus(type, otherType) {
      var item;

      for (item in selections[type]) {
        if (selections[type].hasOwnProperty(item)) {
          if (selections[type][item] !== list.selected.NONE) {
            status[type].isSelected = true;
            status[otherType].isInfluenced = true;
            break;
          }
        }
      }
    }

    checkStatus("variable", "individual");

    if (!individualsPresent) {
      parts.scatterplot.width.variable = parts.scatterplot.totalWidth;
      parts.scatterplot.width.individual = 0;
    } else if (status.variable.isSelected === false) {
      checkStatus("individual", "variable");
    }

    if (variablesPresent && invertPlotOrder) {
      render.scatterplot(div, data, "variable", status.variable, flags);
    }

    if (individualsPresent) {
      render.scatterplot(div, data, "individual", status.individual, flags);
    }

    if (variablesPresent && !invertPlotOrder) {
      render.scatterplot(div, data, "variable", status.variable, flags);
    }
  };

  render.scatterplot = function (div, data, type, status, flags) {
    var plotdatum = {
        title: data.method[0].toUpperCase() + " projected " + type + "s",
        points: [
        /* Structure:
          {
            x: 0,
            y: 0,
            xContribution: 0,
            yContribution: 0,
            label: "",
            mass: 0,
            wrappedLabel: "",
            selected: false,
            brushed: false,
            influence: 0
          }*/
        ],
        xVariance: data.explainedVariance[actives.first],
        yVariance: data.explainedVariance[actives.second],
        isInfluenced: status.isInfluenced,
        isSelected: status.isSelected,
        idx: 0,
        brushExtent: [0, 0],
        flags: flags
      },
      projections = data[type + "Projections"],
      plotWidth = parts.scatterplot.width[type],
      scatterPlotChart = list.ScatterPlot(),
      scatterPlotDiv,
      projectionDomain = {
        x: [10000, -10000],
        y: [10000, -10000]
      },
      xContributionSum = 0,
      yContributionSum = 0,
      colormap = d3.interpolateLab("green", "purple"),
      colorscale = d3.scale.linear(),
      colorVariableValues = {},
      colorFn = null,
      influenceScale = d3.scale.linear(),
      maxInfluence = -1000,
      minInfluence = 1000;

    influenceScale
      .range([0.2, 1.0]);

    // Initialise the plot data
    projections.forEach(function (projection) {
      var influence = influences[type][projection.id],
        label = projection.id;

      if (projection.label !== undefined) {
        label = projection.label;
      }

      maxInfluence = Math.max(maxInfluence, influence);
      minInfluence = Math.min(minInfluence, influence);

      if (unifyAxesScaling) {
        // Calculate the domains used when using uniform domains
        projection.coord.forEach(function (coord, coordIdx) {
          // We can skip the first projection, since the y-axis cannot show the first eigenvector
          if (coordIdx !== 0) {
            projectionDomain.y[0] = Math.min(projectionDomain.y[0], coord);
            projectionDomain.y[1] = Math.max(projectionDomain.y[1], coord);
          }
          // We can skip the last projection, since the x-axis cannot show the last eigenvector
          if (coordIdx !== projection.coord.length - 1) {
            projectionDomain.x[0] = Math.min(projectionDomain.x[0], coord);
            projectionDomain.x[1] = Math.max(projectionDomain.x[1], coord);
          }
        });
      }

      // Fill plotdata
      plotdatum.points.push({
        x: projection.coord[actives.first],
        y: projection.coord[actives.second],
        xContribution: projection.contrib[actives.first],
        yContribution: projection.contrib[actives.second],
        label: label,
        id: projection.id,
        mass: projection.mass,
        wrappedLabel: projection.wrappedLabel,
        selected: selections[type][projection.id],
        influence: influence
      });

      xContributionSum += projection.contrib[actives.first];
      yContributionSum += projection.contrib[actives.second];
    });

    influenceScale.domain([minInfluence, maxInfluence]);

    plotdatum.points.forEach(function (d) {
      d.xContribution /= xContributionSum / 10000;
      d.yContribution /= yContributionSum / 10000;
      d.xContribution = Math.round(d.xContribution) / 100;
      d.yContribution = Math.round(d.yContribution) / 100;
      d.influence = influenceScale(d.influence);
    });

    if (!plotdatum.isInfluenced) {
      plotdatum.brushExtent = colormapBrushExtent[type];
    }

    function brushed(sp, selected, idx, extent0, extent1) {
      /*jslint unparam:true*/
      plotdatum.points.forEach(function (point, pointIdx) {
        if (selected[pointIdx]) {
          list.selectByPoint(selections[type], point.id);
        } else {
          list.deselectByPoint(selections[type], point.id);
        }
      });

      colormapBrushExtent[type] = [extent0, extent1];

      if (type === "individual") {
        events.changeIndividualSelection(drp);
      } else {
        events.changeVariableSelection(drp);
      }
    }

    function select(sp, selected, idx) {
      brushed(sp, selected, idx, 0, 0);
    }

    function xyContribution(d, data) {
      return (d.xContribution * data.xVariance + d.yContribution * data.yVariance) / (data.xVariance + data.yVariance);
    }

    scatterPlotChart
      .height(size.height * parts.scatterplot.height)
      .width(size.width * plotWidth)
      .originVisible(parts.scatterplot.origin.visible)
      .originSize(parts.scatterplot.origin.size)
      .unifyAxesScaling(true) // In the case of scatterplot this just refers two the shown axes
      .automaticResize(automaticResize)
      .showAxes(false)
      .showWarning(true)
      .on("selectionEnd", select)
      .on("brushEnd", brushed)
      .on("resize", function (sp, newWidth) {
        /*jslint unparam:true*/
        var currentWidth = size.width * plotWidth,
          newWidthPercentage = plotWidth * (newWidth / currentWidth);

        parts.scatterplot.width[type] = Math.min(plotWidth, newWidthPercentage);

        render.variancePercentageBar(div, data);
      });

    if (unifyAxesScaling) {
      scatterPlotChart
        .showWarning(false)
        .xDomain(projectionDomain.x)
        .yDomain(projectionDomain.y);
    }

    if (type === "individual") {
      // If the user did not specify a colormapping than we will create one based on contribution.
      if (color.variableValues === null) {
        plotdatum.points.forEach(function (point) {
          colorVariableValues[point.id] = xyContribution(point, plotdatum);
        });
      } else {
        colorVariableValues = color.variableValues;
      }

      if (color.colorFn === null) {
        colorscale
          .domain(d3.extent(plotdatum.points, function (point) { return colorVariableValues[point.id]; }))
          .range([0, 1]);

        colorFn = function (datum) {
          return colormap(colorscale(datum));
        };
      } else {
        colorFn = color.colorFn;
      }

      scatterPlotChart
        .colorFunction(colorFn)
        .colorVariableName(color.variableName)
        .colorVariableValues(colorVariableValues);
    } else {
      // The sqrt is needed because the pointSize function is used for ellipse radius, but we want to encode
      // something in area
      scatterPlotChart.pointSize(function (d) { return Math.sqrt(xyContribution(d, plotdatum)); });
    }

    scatterPlotDiv = div.selectAll("div." + type + ".scatterplot").data([plotdatum]);
    scatterPlotDiv
      .enter()
      .append("div")
      .attr("class", type + " scatterplot");
    scatterPlotDiv.exit().remove();
    scatterPlotDiv
      .style("display", "inline-block")
      .style("vertical-align", "top")
      .style("width", 100 * parts.scatterplot.width[type] + "%")
      .style("height", 100 * parts.scatterplot.height + "%")
      .style("outline-style", "solid")
      .style("outline-width", "1px")
      .style("outline-color", "#ddd")
      .call(scatterPlotChart);
  };

  render.contributions = function (div, data) {
    // The contribution data to plot
    var plotdata = [
        {
          component: "x",
          variance: data.explainedVariance[actives.first],
          contributions: [],
          index: 0,
          brushExtent: contributionBrushExtents[0],
          maxContribution: 0
        },
        {
          component: "y",
          variance: data.explainedVariance[actives.second],
          contributions: [],
          index: 1,
          brushExtent: contributionBrushExtents[1],
          maxContribution: 0
        },
        {
          component: "x+y",
          variance: data.explainedVariance[actives.first] + data.explainedVariance[actives.second],
          contributions: [],
          index: 2,
          brushExtent: contributionBrushExtents[2],
          maxContribution: 0
        },
        {
          component: "other axes",
          variance: 0,
          contributions: [],
          index: 3,
          brushExtent: contributionBrushExtents[3],
          maxContribution: 0
        },
        {
          component: "influence",
          variance: null,
          contributions: [],
          index: 4,
          brushExtent: contributionBrushExtents[4],
          maxContribution: 0
        }
      ],
      barplot = list.BarPlot(),
      idx,
      barplotDiv,
      sortedContributions = [],
      indices,
      sortSelect,
      xMax = 0.0,
      yMax = 0.0,
      xyMax = 0.0,
      errorMax = 0.0,
      influenceMax = 0.0,
      //accMax,
      xSum = 0.0,
      ySum = 0.0,
      totalSum = 0.0,
      selectionSortCheck,
      checkboxLabel,
      controlDiv,
      barplotsDiv;

    // Create a div containing all the Barplots, this is necessary to keep everything sized correctly
    barplotsDiv = div.selectAll("div.barplots").data([true]);
    barplotsDiv.enter()
      .append("div")
      .attr("class", "barplots")
      .style("display", "inline-block")
      .style("text-align", "left")
      .style("outline-style", "solid")
      .style("outline-width", "1px")
      .style("outline-color", "#ddd");
    barplotsDiv
      .style("width", 100 * parts.contributions.width + "%")
      .style("height", 100 * parts.contributions.height + "%");

    plotdata[3].variance = 100 - plotdata[0].variance - plotdata[1].variance;



    //  Convert data to plotdata
    data.variableProjections.forEach(function (projection, projectionIdx) {
      var contributions,
        contributionsSum,
        contribution1,
        contribution2,
        label = projection.id,
        influence = influences.variable[projection.id];

      if (projection.label !== undefined) {
        label = projection.label;
      }

      contributions = projection.contrib.map(function (contribution, contributionIdx) {
        return contribution * data.explainedVariance[contributionIdx];
      });

      contribution1 = contributions[actives.first];
      contribution2 = contributions[actives.second];

      xSum += contribution1;
      ySum += contribution2;
      contributionsSum = list.arraySum(contributions);

      totalSum += contributionsSum;

      if (influence === undefined) {
        influence = 0;
      }

      sortedContributions.push({
        index: projectionIdx,
        xContribution: contribution1,
        yContribution: contribution2,
        xyContribution: contribution1 + contribution2,
        errorContribution: contributionsSum - contribution1 - contribution2,
        influenceContribution: influence,
        selected: selections.variable[projection.id],
        label: label
      });
    });

    sortedContributions.forEach(function (item) {
      item.xContribution /= xSum / 100;
      item.yContribution /= ySum / 100;
      item.xyContribution /= (xSum + ySum) / 100;
      item.errorContribution /= (totalSum - xSum - ySum) / 100;

      xMax = Math.max(xMax, item.xContribution);
      yMax = Math.max(yMax, item.yContribution);
      errorMax = Math.max(errorMax, item.errorContribution);
      xyMax = Math.max(xyMax, item.xyContribution);
      influenceMax = Math.max(influenceMax, item.influenceContribution);
    });

    //accMax = Math.max(Math.max(xMax, yMax), xyMax);
    plotdata[0].maxContribution = xMax;
    plotdata[1].maxContribution = yMax;
    plotdata[2].maxContribution = xyMax;
    plotdata[3].maxContribution = errorMax;
    plotdata[4].maxContribution = influenceMax;


    // Add the controls that control the sorting
    controlDiv = barplotsDiv.selectAll("div.sortcontrol").data([true]);
    controlDiv.enter()
      .append("div")
      .attr("class", "sortcontrol")
      .style("font-size", "12px");

    selectionSortCheck = controlDiv.selectAll("input#selectionSort").data([true]);
    selectionSortCheck.enter()
      .append("input")
      .attr("id", "selectionSort")
      .attr("type", "checkbox")
      .style("vertical-align", "middle");

    checkboxLabel = controlDiv.selectAll("label#selectionSortLabel").data([true]);
    checkboxLabel.enter()
      .append("label")
      .attr("id", "selectionSortLabel")
      .attr("for", "selectionSort")
      .text("Group on selection")
      .style("font-size", "10px")
      .style("vertical-align", "middle");

    sortSelect = controlDiv.selectAll("select#sort").data([true]);
    sortSelect.enter()
      .append("select")
      .attr("id", "sort")
      .style("width", "98%")
      .each(function () {
        var elem = d3.select(this);
        elem.append("option").attr("value", "x").text("Sort on x");
        elem.append("option").attr("value", "y").text("Sort on y");
        elem.append("option").attr("value", "xy").text("Sort on x+y").attr("selected", "selected");
        elem.append("option").attr("value", "error").text("Sort on other axes");
        elem.append("option").attr("value", "influence").text("Sort on influence");
      });

    function sortEvent() {
      resetContributionBrushExtents();
      render.contributions(div, data);
    }
    sortSelect.on("change", sortEvent);
    selectionSortCheck.on("change", sortEvent);

    // Sort the contributions
    sortedContributions.sort(function (d1, d2) {
      var sortOn = sortSelect.node().value + "Contribution",
        value1 = d1[sortOn],
        value2 = d2[sortOn];

      if (selectionSortCheck.node().checked && d1.selected !== list.selected.POINT) {
        value1 -= 1000;
      }
      if (selectionSortCheck.node().checked && d2.selected !== list.selected.POINT) {
        value2 -= 1000;
      }

      if (value1 < value2) {
        return 1;
      }
      if (value1 > value2) {
        return -1;
      }

      return 0;
    });

    // Fill plotdata with the sorted contributions
    plotdata[0].contributions = sortedContributions.map(function (d) { return {contribution: d.xContribution, selected: d.selected, label: d.label}; });
    plotdata[1].contributions = sortedContributions.map(function (d) { return {contribution: d.yContribution, selected: d.selected, label: d.label}; });
    plotdata[2].contributions = sortedContributions.map(function (d) { return {contribution: d.xyContribution, selected: d.selected, label: d.label}; });
    plotdata[3].contributions = sortedContributions.map(function (d) { return {contribution: d.errorContribution, selected: d.selected, label: d.label}; });
    plotdata[4].contributions = sortedContributions.map(function (d) { return {contribution: d.influenceContribution, selected: d.selected, label: d.label}; });

    if (influenceMax === 0) {
      plotdata.splice(4, 1);
    }

    indices = sortedContributions.map(function (d) { return d.index; });

    //  Respond to a brush event within the BarPlot chart
    function brushed(bp, index, start, end) {
      /*jslint unparam:true*/
      var selected = [];

      data.variableProjections.forEach(function () {
        selected.push(false);
      });

      function setSelected(range) {
        for (idx = range[0]; idx !== range[1]; idx += 1) {
          selected[indices[idx]] = true;
        }
      }

      contributionBrushExtents[index] = [start, end];

      contributionBrushExtents.forEach(function (brushExtent) {
        setSelected(brushExtent);
      });

      data.variableProjections.forEach(function (point, pointIdx) {
        if (selected[pointIdx]) {
          list.selectByBar(selections.variable, point.id);
        } else {
          list.deselectByBar(selections.variable, point.id);
        }
      });

      events.changeVariableSelection(drp);
    }

    barplot
      .height((size.height * parts.contributions.height) / (plotdata.length + 1))
      .width(size.width * parts.contributions.width)
      .on("brushEnd", brushed);

    barplotDiv = barplotsDiv.selectAll("div.barplot").data(plotdata);
    barplotDiv
      .enter()
      .insert("div", "div.sortcontrol")
      .attr("class", "barplot");
    barplotDiv.exit().remove();
    barplotDiv
      .style("width", "100%")
      .style("height", "calc((100% - " + controlDiv.node().clientHeight + "px) / " + plotdata.length + ")")
      .call(barplot);

    barplotDiv.exit().remove();
  };

  render.variancePercentageBar = function (div, data) {
    var plotdata = [
        {
          variances: data.explainedVariance
        }
      ],
      barPlot = list.VariancePercentagePlot(),
      barPlotDiv,
      plotWidth = parts.scatterplot.width.individual + parts.scatterplot.width.variable + parts.contributions.width;

    barPlot
      .width(size.width * plotWidth)
      .height(size.height * parts.variancepercentage.height)
      .actives(actives)
      .on("activesChanged", function () {
        actives = barPlot.actives();

        resetContributionBrushExtents();
        resetColormapBrushExtent();

        render.dimredplot(div, data, {pointsChanged: true});
        events.changeAxes(drp, [actives.first, actives.second]);
      });

    barPlotDiv = div.selectAll("div.variancepercentageplot").data(plotdata);
    barPlotDiv
      .enter()
      .append("div")
      .attr("class", "variancepercentageplot");
    barPlotDiv.exit().remove();
    barPlotDiv
      .style("margin-left", 100 * (1 - plotWidth) + "%")
      .style("width", 100 * plotWidth + "%")
      .style("height", 100 * parts.variancepercentage.height + "%")
      .style("outline-style", "solid")
      .style("outline-width", "1px")
      .style("outline-color", "#ddd");

    barPlotDiv
      .call(barPlot);

    barPlotDiv.exit().remove();
  };

  list.DimRedPlot.setTooltip = function (header, content) {
    var tooltip = d3.select("div.dimredplot-tooltip");

    tooltip.style("display", "block");
    tooltip.style("left", (d3.event.pageX + 5) + "px");
    tooltip.style("top", (d3.event.pageY + 5) + "px");


    tooltip.select("strong").html(header);
    tooltip.select("p").html(content);
  };

  list.DimRedPlot.removeTooltip = function () {
    d3.select("div.dimredplot-tooltip").style("display", "none");
  };

  drp.width = function (_) {
    if (!arguments.length) {return size.width; }
    size.width = _;
    return drp;
  };

  drp.height = function (_) {
    if (!arguments.length) {return size.height; }
    size.height = _;
    return drp;
  };

  drp.originVisible = function (_) {
    if (!arguments.length) {return parts.scatterplot.origin.visible; }
    parts.scatterplot.origin.visible = _;
    return drp;
  };

  drp.originSize = function (_) {
    if (!arguments.length) {return parts.scatterplot.origin.size; }
    parts.scatterplot.origin.size = _;
    return drp;
  };

  drp.individualSelections = function (_) {
    if (!arguments.length) {return selections.individual; }
    selections.individual = _;
    resetContributionBrushExtents();
    colormapBrushExtent.individual = [0, 0];
    return drp;
  };

  drp.variableSelections = function (_) {
    if (!arguments.length) {return selections.variable; }
    selections.variable = _;
    colormapBrushExtent.variable = [0, 0];
    return drp;
  };

  drp.individualInfluences = function (_) {
    if (!arguments.length) {return influences.individual; }
    influences.individual = _;
    colormapBrushExtent.individual = [0, 0];
    return drp;
  };

  drp.variableInfluences = function (_) {
    if (!arguments.length) {return influences.variable; }
    influences.variable = _;
    resetContributionBrushExtents();
    colormapBrushExtent.variable = [0, 0];
    return drp;
  };

  drp.unifyAxesScaling = function (_) {
    if (!arguments.length) {return unifyAxesScaling; }
    unifyAxesScaling = _;
    return drp;
  };

  drp.automaticResize = function (_) {
    if (!arguments.length) {return automaticResize; }
    automaticResize = _;
    return drp;
  };

  drp.invertPlotOrder = function (_) {
    if (!arguments.length) {return invertPlotOrder; }
    if (_ !== invertPlotOrder) {
      plotOrderChanged = true;
    }

    invertPlotOrder = _;
    return drp;
  };

  drp.colorVariableName = function (_) {
    if (!arguments.length) {return color.variableName; }
    color.variableName = _;
    return drp;
  };

  drp.colorVariableValues = function (_) {
    if (!arguments.length) {return color.variableValues; }
    color.variableValues = _;
    return drp;
  };

  drp.colorFunction = function (_) {
    if (!arguments.length) {return color.colorFn; }
    color.colorFn = _;
    return drp;
  };

  d3.rebind(drp, events, "on");
  return drp;
};
