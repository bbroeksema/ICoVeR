/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global d3, _*/

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
        width: 1.0,
        height: 0.05
      },
      scatterplot: {
        width: 0.80,
        height: 0.95,
        origin: { size: 25, visible: true }
      },
      contributions: {
        width: 0.20,
        height: 0.95
      }
    },
    render = {},
    events = d3.dispatch.apply(this, ["changeVariableSelection", "changeIndividualSelection"]),
    actives = [{idx: 0, scroll: false}, {idx: 1, scroll: true}],
    contributionBrushExtents = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0]
    ],
    colormapBrushExtent = {
      variable: [0, 0],
      individual: [0, 0]
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
      [0, 0]
    ];
  }

  function resetColormapBrushExtent() {
    colormapBrushExtent.variable = [0, 0];
    colormapBrushExtent.individual = [0, 0];
  }

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

      div.selectAll("p").data([true]).enter().append("p");

      render.dimredplot(d3.select(this), data, {pointsChanged: true});

      div.exit().remove();
    });
  }

  render.dimredplot = function (div, data, flags) {
    render.variancePercentageBar(div, data);
    render.scatterplot(div, data, flags);
    render.contributions(div, data);
  };

  render.scatterplot = function (div, data, flags) {
    var pointSelect = d3.select("select#points"),
      colorSelect1 = d3.select("select#color1"),
      colorSelect2 = d3.select("select#color2"),
      individualsPresent = data.individualProjections !== undefined,
      variablesPresent = data.variableProjections !== undefined,
      scatterplotWidth = parts.scatterplot.width,
      plotdata = [
        {
          title: data.method[0].toUpperCase() + " projected individuals/rows",
          points: [],
          xVariance: data.explainedVariance[actives[0].idx],
          yVariance: data.explainedVariance[actives[1].idx],
          isInfluenced: false,
          idx: 0,
          renderFunction: "pointsAsEllipses2",//pointSelect.node().value,
          colormap: "blueRed",//colorSelect1.node().value,
          brushExtent: [0, 0],
          flags: flags
        },
        {
          title: data.method[0].toUpperCase() + " projected variables/columns",
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
          isInfluenced: false,
          xVariance: data.explainedVariance[actives[0].idx],
          yVariance: data.explainedVariance[actives[1].idx],
          idx: 0,
          renderFunction: "pointsAsEllipses2",//pointSelect.node().value,
          colormap: "blueRed",//colorSelect1.node().value,
          brushExtent: [0, 0],
          flags: flags
        }
      ],
      scatterPlot = list.ScatterPlot(),
      scatterPlotDiv;

    // Handle html select tag changes
    pointSelect.on("change", function () {
      data.flags.pointsChanged = true;
      render.scatterplot(div, data);
    });
    colorSelect1.on("change", function () {
      data.flags.pointsChanged = true;
      render.scatterplot(div, data);
    });
    colorSelect2.on("change", function () {
      data.flags.pointsChanged = true;
      render.scatterplot(div, data);
    });

    plotdata.forEach(function (d, i) {
      /*jslint unparam:true*/
      plotdata[i].idx = i;
    });

    // Initialise the plot data
    function initPlotdata(plotData, fillData, component) {
      var xContributionSum = 0,
        yContributionSum = 0;

      fillData.forEach(function (d) {
        var influence = influences[component][d.id],
          label = d.id;

        if (d.label !== undefined) {
          label = d.label;
        }

        plotData.points.push({
          x: d.coord[actives[0].idx],
          y: d.coord[actives[1].idx],
          xContribution: d.contrib[actives[0].idx],
          yContribution: d.contrib[actives[1].idx],
          label: label,
          id: d.id,
          mass: d.mass,
          wrappedLabel: d.wrappedLabel,
          selected: selections[component][d.id],
          influence: influence
        });
        if (influence > 0) {
          plotData.isInfluenced = true;
        }

        xContributionSum += d.contrib[actives[0].idx];
        yContributionSum += d.contrib[actives[1].idx];
      });

      plotData.points.forEach(function (d) {
        d.xContribution /= xContributionSum / 10000;
        d.yContribution /= yContributionSum / 10000;
        d.xContribution = Math.round(d.xContribution) / 100;
        d.yContribution = Math.round(d.yContribution) / 100;
      });

      if (!plotData.isInfluenced) {
        plotData.brushExtent = colormapBrushExtent[component];
      }
    }

    if (individualsPresent) {
      initPlotdata(plotdata[0], data.individualProjections, "individual");
    }
    if (variablesPresent) {
      initPlotdata(plotdata[1], data.variableProjections, "variable");
    }

    if (variablesPresent && individualsPresent) {
      scatterplotWidth /= 2;
    }

    function brushed(sp, selected, idx, extent0, extent1) {
      /*jslint unparam:true*/
      var states = selections.variable;

      if (idx === 0) {
        states = selections.individual;

      }

      plotdata[idx].points.forEach(function (point, pointIdx) {
        if (selected[pointIdx]) {
          list.selectByPoint(states, point.id);
        } else {
          list.deselectByPoint(states, point.id);
        }
      });

      if (idx === 0) {
        colormapBrushExtent.individual = [extent0, extent1];
        events.changeIndividualSelection(drp);
      } else {
        colormapBrushExtent.variable = [extent0, extent1];
        events.changeVariableSelection(drp);
      }
    }

    function select(sp, selected, idx) {
      brushed(sp, selected, idx, 0, 0);
    }

    scatterPlot
      .height(size.height * parts.scatterplot.height)
      .width(size.width * scatterplotWidth)
      .originVisible(parts.scatterplot.origin.visible)
      .originSize(parts.scatterplot.origin.size)
      .on("selectionEnd", select)
      .on("brushEnd", brushed);

    scatterPlotDiv = div.selectAll("div.scatterplot").data(plotdata.filter(function (d) {
      return d.points.length !== 0;
    }));
    scatterPlotDiv
      .enter()
      .append("div")
      .attr("class", "scatterplot");
    scatterPlotDiv.exit().remove();
    scatterPlotDiv
      .style("float", "left")
      .style("width", 100 * scatterplotWidth + "%")
      .style("height", 100 * parts.scatterplot.height + "%")
      .style("outline-style", "solid")
      .style("outline-width", "1px")
      .style("outline-color", "#ddd")
      .call(scatterPlot);
  };

  render.contributions = function (div, data) {
    // The contribution data to plot
    var plotdata = [
        {
          component: "x",
          variance: data.explainedVariance[actives[0].idx],
          contributions: [],
          index: 0,
          brushExtent: contributionBrushExtents[0],
          maxContribution: 0
        },
        {
          component: "y",
          variance: data.explainedVariance[actives[1].idx],
          contributions: [],
          index: 1,
          brushExtent: contributionBrushExtents[1],
          maxContribution: 0
        },
        {
          component: "x+y",
          variance: data.explainedVariance[actives[0].idx] + data.explainedVariance[actives[1].idx],
          contributions: [],
          index: 2,
          brushExtent: contributionBrushExtents[2],
          maxContribution: 0
        },
        {
          component: "other axes",
          variance: 0,
          contributions: [],
          index: 2,
          brushExtent: contributionBrushExtents[2],
          maxContribution: 0
        },
        {
          component: "total",
          variance: 100,
          contributions: [],
          index: 3,
          brushExtent: contributionBrushExtents[3],
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
      totalMax = 0.0,
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
      .style("position", "relative")
      .style("float", "left");
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
        label = projection.id;

      if (projection.label !== undefined) {
        label = projection.label;
      }


      contributions = projection.contrib.map(function (contribution, contributionIdx) {
        return contribution * data.explainedVariance[contributionIdx];
      });

      contribution1 = contributions[actives[0].idx];
      contribution2 = contributions[actives[1].idx];

      xSum += contribution1;
      ySum += contribution2;
      contributionsSum = list.arraySum(contributions);

      totalSum += contributionsSum;

      sortedContributions.push({
        index: projectionIdx,
        xContribution: contribution1,
        yContribution: contribution2,
        xyContribution: contribution1 + contribution2,
        errorContribution: contributionsSum - contribution1 - contribution2,
        totalContribution: contributionsSum,
        selected: selections.variable[projection.id],
        label: label
      });
    });

    sortedContributions.forEach(function (item) {
      item.xContribution /= xSum / 100;
      item.yContribution /= ySum / 100;
      item.xyContribution /= (xSum + ySum) / 100;
      item.errorContribution /= (totalSum - xSum - ySum) / 100;
      item.totalContribution /= totalSum / 100;

      xMax = Math.max(xMax, item.xContribution);
      yMax = Math.max(yMax, item.yContribution);
      errorMax = Math.max(errorMax, item.errorContribution);
      xyMax = Math.max(xyMax, item.xyContribution);
      totalMax = Math.max(totalMax, item.totalContribution);
    });


    //accMax = Math.max(Math.max(xMax, yMax), xyMax);
    plotdata[0].maxContribution = xMax;
    plotdata[1].maxContribution = yMax;
    plotdata[2].maxContribution = xyMax;
    plotdata[3].maxContribution = errorMax;
    plotdata[4].maxContribution = totalMax;


    // Add the controls that control the sorting
    controlDiv = barplotsDiv.selectAll("div.sortcontrol").data([true]);
    controlDiv.enter()
      .append("div")
      .attr("class", "sortcontrol")
      .style("position", "absolute")
      .style("bottom", 0)
      .style("left", 0)
      .style("width", "100%");

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
      .style("width", "100%")
      .each(function () {
        var elem = d3.select(this);
        elem.append("option").attr("value", "x").text("Sort on x");
        elem.append("option").attr("value", "y").text("Sort on y");
        elem.append("option").attr("value", "xy").text("Sort on x+y").attr("selected", "selected");
        elem.append("option").attr("value", "error").text("Sort on other axes");
        elem.append("option").attr("value", "total").text("Sort on total");
      });

    function sortEvent() {
      resetContributionBrushExtents();
      render.contributions(div, data);
    }
    sortSelect.on("change", sortEvent);
    selectionSortCheck.on("change", sortEvent);

    // Sort the contributions
    sortedContributions = _.sortBy(sortedContributions, function (d, idx) {
      var sortOn = sortSelect.node().value + "Contribution",
        value = d[sortOn];

      if (selectionSortCheck.node().checked && data.variableProjections[idx].brushed) {
        value += 1000;
      }

      return -value;
    });

    // Fill plotdata with the sorted contributions
    plotdata[0].contributions = sortedContributions.map(function (d) { return {contribution: d.xContribution, selected: d.selected, label: d.label}; });
    plotdata[1].contributions = sortedContributions.map(function (d) { return {contribution: d.yContribution, selected: d.selected, label: d.label}; });
    plotdata[2].contributions = sortedContributions.map(function (d) { return {contribution: d.xyContribution, selected: d.selected, label: d.label}; });
    plotdata[3].contributions = sortedContributions.map(function (d) { return {contribution: d.errorContribution, selected: d.selected, label: d.label}; });
    plotdata[4].contributions = sortedContributions.map(function (d) { return {contribution: d.totalContribution, selected: d.selected, label: d.label}; });

    indices = sortedContributions.map(function (d) { return d.index; });

    //  Respond to a brush event within the BarPlot chart
    function brushed(bp, index, start, end) {
      /*jslint unparam:true*/
      var selected = [],
        brushIdx;

      for (idx = 0; idx !== data.variableProjections.length; idx += 1) {
        selected.push(false);
      }

      function setSelected(range) {
        for (idx = range[0]; idx !== range[1]; idx += 1) {
          selected[indices[idx]] = true;
        }
      }

      contributionBrushExtents[index] = [start, end];

      for (brushIdx = 0; brushIdx !== 4; brushIdx += 1) {
        setSelected(contributionBrushExtents[brushIdx]);
      }

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
      .attr("class", "barplot")
      .style("float", "left");
    barplotDiv.exit().remove();
    barplotDiv
      .style("width", "100%")
      .style("height", 100 / (plotdata.length + 1) + "%")
      .call(barplot);

    barplotDiv.exit().remove();
  };

  render.variancePercentageBar = function (div, data) {
    var plotdata = [
        {
          variances: data.explainedVariance,
          actives: actives
        }
      ],
      barPlot = list.VariancePercentagePlot(),
      barPlotDiv;

    barPlot
      .width(size.width * parts.variancepercentage.width)
      .height(size.height * parts.variancepercentage.height)
      .on("rotate", function (drp, direction) {
        /*jslint unparam:true*/
        var update = false,
          addToActives = 0,
          newActives;

        if (direction === "up") {
          addToActives = 1;
          update = true;
        } else if (direction === "down") {
          addToActives = -1;
          update = true;
        }

        if (update) {
          newActives = actives.map(function (d) {
            var newIdx = d.idx + addToActives;
            if (!d.scroll || newIdx < 0 || newIdx >= data.explainedVariance.length) {
              newIdx = d.idx;
            }
            return {idx: newIdx, scroll: d.scroll};
          });

          if (newActives[0].idx !== newActives[1].idx) {
            actives = newActives;
          }

          resetContributionBrushExtents();
          resetColormapBrushExtent();
          render.dimredplot(div, data, {pointsChanged: true});
        }
      })
      .on("selectVariance", function (drp, activeIdx, varianceIdx) {
        /*jslint unparam:true*/
        var tmpActive;

        if (actives[activeIdx].idx === varianceIdx) {
          return;
        }

        if (actives[activeIdx === 0 ? 1 : 0].idx === varianceIdx) {
          return;
        }

        actives[activeIdx].idx = varianceIdx;

        // The actives should always be ordered left to right
        if (actives[0].idx > actives[1].idx) {
          tmpActive = actives[0].idx;
          actives[0].idx = actives[1].idx;
          actives[1].idx = tmpActive;
        }

        resetContributionBrushExtents();
        resetColormapBrushExtent();
        render.dimredplot(div, data, {pointsChanged: true});
      });

    barPlotDiv = div.selectAll("div.variancepercentageplot").data(plotdata);
    barPlotDiv
      .enter()
      .append("div")
      .attr("class", "variancepercentageplot");
    barPlotDiv.exit().remove();
    barPlotDiv
      .style("float", "left")
      .style("width", 100 * parts.variancepercentage.width + "%")
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

  d3.rebind(drp, events, "on");
  return drp;
};
