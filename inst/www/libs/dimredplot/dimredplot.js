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
        maxWidth: 0.80,
        height: 0.95,
        width: [0.40, 0.40],
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
    unifyAxesScaling = true,
    automaticResize = false,
    contributionBrushExtents,
    colormapBrushExtent = {},
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

      div.selectAll("p").data([true]).enter().append("p");

      render.dimredplot(d3.select(this), data, {pointsChanged: true});

      div.exit().remove();
    });
  }

  render.dimredplot = function (div, data, flags) {
    // We reset the scatterplot width here. This way any rerendering of other elements
    // after this rerendering knows what the current scatterplot width is.
    parts.scatterplot.width[0] = parts.scatterplot.maxWidth / 2;
    parts.scatterplot.width[1] = parts.scatterplot.maxWidth / 2;

    render.variancePercentageBar(div, data);
    render.contributions(div, data);
    render.scatterplot(div, data, flags);
  };

  render.scatterplot = function (div, data, flags) {
    var individualsPresent = data.individualProjections !== undefined,
      variablesPresent = data.variableProjections !== undefined,
      plotdata = [
        {
          title: data.method[0].toUpperCase() + " projected individuals/rows",
          points: [],
          xVariance: data.explainedVariance[actives[0].idx],
          yVariance: data.explainedVariance[actives[1].idx],
          isInfluenced: false,
          isSelected: false,
          idx: 0,
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
          isSelected: false,
          xVariance: data.explainedVariance[actives[0].idx],
          yVariance: data.explainedVariance[actives[1].idx],
          idx: 0,
          brushExtent: [0, 0],
          flags: flags
        }
      ],
      scatterPlotCharts,
      scatterPlotDiv;

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
        if (selections[component][d.id] !== list.selected.NONE) {
          plotData.isSelected = true;
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
      if (plotdata[0].isSelected) {
        plotdata[1].isInfluenced = true;
      }
    }
    if (variablesPresent) {
      initPlotdata(plotdata[1], data.variableProjections, "variable");
      if (plotdata[1].isSelected) {
        plotdata[0].isInfluenced = true;
      }
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

    function xyContribution(d, data) {
      return (d.xContribution * data.xVariance + d.yContribution * data.yVariance) / (data.xVariance + data.yVariance);
    }

    scatterPlotCharts = plotdata.map(function (datum) {
      var scatterPlot = list.ScatterPlot(),
        colormap = d3.interpolateLab("green", "purple"),
        colorscale = d3.scale.linear(),
        colorVariableValues = {},
        colorFn = null,
        plotWidth = parts.scatterplot.maxWidth / 2;

      scatterPlot
        .height(size.height * parts.scatterplot.height)
        .width(size.width * plotWidth)
        .originVisible(parts.scatterplot.origin.visible)
        .originSize(parts.scatterplot.origin.size)
        .unifyAxesScaling(unifyAxesScaling)
        .automaticResize(automaticResize)
        .on("selectionEnd", select)
        .on("brushEnd", brushed)
        .on("resize", function (sp, newWidth, idx) {
          /*jslint unparam:true*/
          var currentWidth = size.width * plotWidth,
            newWidthPercentage = plotWidth * (newWidth / currentWidth);

          parts.scatterplot.width[idx] = Math.min(plotWidth, newWidthPercentage);

          render.variancePercentageBar(div, data);
        });

      if (datum.idx === 0 && individualsPresent) {
        // If the user did not specify a colormapping than we will create one based on contribution.
        if (color.variableValues === null) {
          datum.points.forEach(function (point) {
            colorVariableValues[point.id] = xyContribution(point, datum);
          });
        } else {
          colorVariableValues = color.variableValues;
        }

        if (color.colorFn === null) {
          colorscale
            .domain(d3.extent(datum.points, function (point) { return colorVariableValues[point.id]; }))
            .range([0, 1]);

          colorFn = function (datum) {
            return colormap(colorscale(datum));
          };
        } else {
          colorFn = color.colorFn;
        }

        scatterPlot
          .colorFunction(colorFn)
          .colorVariableName(color.variableName)
          .colorVariableValues(colorVariableValues);
      } else {
        scatterPlot.pointSize(function (d) { return xyContribution(d, datum); });
      }

      return scatterPlot;
    });

    scatterPlotDiv = div.selectAll("div.scatterplot").data(plotdata.filter(function (d) {
      return d.points.length !== 0;
    }).reverse());
    scatterPlotDiv
      .enter()
      .append("div")
      .attr("class", "scatterplot");
    scatterPlotDiv.exit().remove();
    scatterPlotDiv
      .style("float", "right")
      .style("width", function (datum) {
        return 100 * parts.scatterplot.width[datum.idx] + "%";
      })
      .style("height", 100 * parts.scatterplot.height + "%")
      .style("outline-style", "solid")
      .style("outline-width", "1px")
      .style("outline-color", "#ddd")
      .each(function (datum) {
        /*jslint unparam:true*/
        d3.select(this).call(scatterPlotCharts[datum.idx]);
      });
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
      .style("position", "relative")
      .style("float", "right")
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

      contribution1 = contributions[actives[0].idx];
      contribution2 = contributions[actives[1].idx];

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
      barPlotDiv,
      plotWidth = parts.scatterplot.width[0] + parts.scatterplot.width[1] + parts.contributions.width;

    barPlot
      .width(size.width * plotWidth)
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
      .style("float", "right")
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
