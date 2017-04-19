import {
  axisLeft,
  axisRight,
  axisBottom,
  bisector,
  brushX,
  event,
  extent,
  line,
  mouse,
  select,
  scaleLinear,
  scaleLog,
  scaleOrdinal,
  scaleUtc,
  schemeCategory10,
  transition,
} from 'd3';
import moment from 'moment';
import { has } from '../utils';
import './TimeSeriesChart.css';

const SCALE_TYPES = { linear: true, log: true };
const X = 0;
const Y = 1;
const unitMap = {
  p75: 'durationUnit',
  p95: 'durationUnit',
  p98: 'durationUnit',
  p99: 'durationUnit',
  p999: 'durationUnit',
  max: 'durationUnit',
  mean: 'durationUnit',
  median: 'durationUnit',
  min: 'durationUnit',
  std_dev: 'durationUnit',
  one_min_rate: 'rateUnit',
  five_min_rate: 'rateUnit',
  fifteen_min_rate: 'rateUnit',
  mean_rate: 'rateUnit',
};

// TODO: add an unmount method to delete underlying DOM elements.
// TODO: add method to clear brush selection.
// TODO: add methods to toggle loading state
//      - Render some form of loading mask when loading data
// TODO: Disable log scales if the data is invalid (includes values of 0)
//      - Should probably warn the user somehow that their dataset does not allow for log scales.
// TODO: determine if we should format ticks similar to how it was done in Rickshaw where numbers were abbreviated
//      - i.e. 1,000,000 -> 1M, 15,000 -> 15k
//      - https://github.com/shutterstock/rickshaw/blob/master/src/js/Rickshaw.Fixtures.Number.js

function calculateXDomain(data, axis) {
  /**
   * We have a separate function for calculating the x domain because we know it's sorted, so we don't need to scan
   * every value of each series to figure it out, just the first and last.
   */
  if (axis.userDefinedDomain) {
    return axis.domain;
  }

  return data.reduce((domain, series) => {
    const min = series.rows[0][X];
    const max = series.rows[series.rows.length - 1][X];

    if (domain[0] === null || min < domain[0]) {
      domain[0] = min; // eslint-disable-line no-param-reassign
    }

    if (domain[1] === null || max > domain[1]) {
      domain[1] = max; // eslint-disable-line no-param-reassign
    }

    return domain;
  }, [null, null]);
}

function calculateYDomain(data) {
  let min = null;
  let max = null;

  data.forEach((series) => {
    const seriesDomain = extent(series.rows, d => d[Y]);

    if (min === null || seriesDomain[0] < min) {
      min = seriesDomain[0];
    }

    if (max === null || seriesDomain[1] > max) {
      max = seriesDomain[1];
    }
  });

  if (min === max) {
    if (min === 0 && max === 0) {
      min = -5;
      max = 5;
    } else {
      min *= 0.8;
      max *= 1.2;
    }
  }

  return [min, max];
}

function groupSeries(data) {
  const leftData = [];
  const rightData = [];
  const seriesNames = []; // Track all of the unique series names so we can set the domain of the color scale.

  data.forEach((series) => {
    seriesNames.push(series.name);

    if (series.axis === 'left') {
      leftData.push(series);
    } else if (series.axis === 'right') {
      rightData.push(series);
    }
  });

  return {
    left: leftData,
    right: rightData,
    color: seriesNames,
  };
}

function updateData(rawData, axisX, axisL, axisR) {
  /**
   * rawData should be in the following format:
   * [
   *    {
   *      name: 'a string', // Used for the legend
   *      axis: 'left', // can be left or right
   *      rows: [ [x, y], [x, y], ...]
   *    },
   *    ...
   *    {...}
   * ]
   */
  if (rawData === null) {
    return null;
  }

  const groupedData = groupSeries(rawData);
  axisL.domain = calculateYDomain(groupedData.left); // eslint-disable-line
  axisR.domain = calculateYDomain(groupedData.right); // eslint-disable-line

  if (!axisX.userDefinedDomain) {
    axisX.scale.domain(calculateXDomain(rawData, axisX));
  }

  axisL.scale.domain(axisL.domain);
  axisR.scale.domain(axisR.domain);

  if (axisL.type === 'linear') {
    axisL.scale.nice();
  }

  if (axisR.type === 'linear') {
    axisR.scale.nice();
  }

  return groupedData;
}

function findAxis(name, data) {
  const findByName = d => d.name === name;

  if (data.left.find(findByName)) {
    return 'L';
  } else if (data.right.find(findByName)) {
    return 'R';
  }

  return '';
}

const HEIGHT = 300;
const TOP_PADDING = 10;
const SIDE_PADDING = 55;

function calculateDimensions(element) {
  const bbox = element.getBoundingClientRect();
  const bottom = 30;
  const previewHeight = 60;
  const previewBottom = 20;

  return {
    previewHeight,
    top: TOP_PADDING,
    left: SIDE_PADDING,
    bottom: HEIGHT - bottom,
    width: bbox.width,
    height: HEIGHT,
    right: bbox.width - SIDE_PADDING,
    previewTop: 5,
    previewBottom: previewHeight - previewBottom,
  };
}

export default function TimeSeriesChart(el) {
  const chart = {};
  let mainData = null;
  let previewData = null;
  const axes = {
    x: {
      type: 'time',
      scale: scaleUtc(),
      axis: axisBottom(),
      userDefinedDomain: false,
      domain: null,
    },
    left: {
      type: 'linear',
      domain: [0, 1],
      scale: scaleLinear(),
      axis: axisLeft(),
    },
    right: {
      type: 'linear',
      domain: [0, 1],
      scale: scaleLinear(),
      axis: axisRight(),
    },
    xPreview: {
      type: 'time',
      scale: scaleUtc(),
      axis: axisBottom(), // Consider using axisTop
      userDefinedDomain: false,
      domain: null,
      brush: brushX(),
      onBrush: null,
      onBrushEnd: null,
    },
    leftPreview: {
      type: 'linear',
      domain: [0, 1],
      scale: scaleLinear(),
      axis: axisLeft(),
    },
    rightPreview: {
      type: 'linear',
      domain: [0, 1],
      scale: scaleLinear(),
      axis: axisRight(),
    },
    color: {
      type: 'color',
      scale: scaleOrdinal(schemeCategory10),
    },
  };

  // Initialize the axis objects with their appropriate scales.
  Object.values(axes).forEach((a) => {
    if (has.call(a, 'axis')) {
      a.axis.scale(a.scale);
    }
  });

  chart.data = (...args) => {
    if (!args.length) {
      return mainData;
    }

    mainData = updateData(args[0], axes.x, axes.left, axes.right);

    return chart;
  };

  chart.previewData = (...args) => {
    if (!args.length) {
      return previewData;
    }

    previewData = updateData(args[0], axes.xPreview, axes.leftPreview, axes.rightPreview);

    return chart;
  };

  function updateScale(axisName, ...args) {
    const axis = axes[axisName];
    const previewAxis = axes[`${axisName}Preview`];

    if (!args.length) {
      return axis.type;
    }

    const scaleType = args[0];

    if (has.call(SCALE_TYPES, scaleType)) {
      axis.type = scaleType;
      previewAxis.type = scaleType;
    } else {
      throw new Error(`Invalid scale ${scaleType}, scale must be one of ${SCALE_TYPES}`);
    }

    if (axis.type === 'log') {
      axis.scale = scaleLog();
      previewAxis.scale = scaleLog();
      axis.axis.scale(axis.scale);
      previewAxis.axis.scale(previewAxis.scale);
    } else {
      axis.scale = scaleLinear();
      axis.axis.scale(axis.scale);
      previewAxis.scale = scaleLinear();
      previewAxis.axis.scale(previewAxis.scale);
    }

    axis.scale.domain(axis.domain);
    previewAxis.scale.domain(previewAxis.domain);

    if (scaleType === 'linear') {
      axis.scale.nice();
      previewAxis.scale.nice();
    }

    return chart;
  }

  chart.leftScale = (...args) => updateScale('left', ...args);
  chart.rightScale = (...args) => updateScale('right', ...args);

  function updateXDomain(axisName, ...args) {
    const axis = axes[axisName];

    if (args.length === 0) {
      return axis.domain;
    }

    const domain = args[0];

    if (domain === null) {
      axis.userDefinedDomain = false;  // eslint-disable-line
    } else {
      axis.userDefinedDomain = true;  // eslint-disable-line
      axis.domain = domain;  // eslint-disable-line
      axis.scale.domain(domain);
    }

    return chart;
  }

  chart.xDomain = (...args) => updateXDomain('x', ...args);
  chart.xPreviewDomain = (...args) => updateXDomain('xPreview', ...args);

  function renderLines(sel, axis, scaleX, scaleY, trans) {
    const groupSelector = `g.${axis}`;
    const scaleC = axes.color.scale;
    const lineGenerator = line()
      .defined(d => d[Y] !== null)
      .x(d => scaleX(d[X]))
      .y(d => scaleY(d[Y]));

    if (sel.select(groupSelector).size() === 0) {
      sel.append('g').attr('class', axis);
    }

    const group = sel.select(groupSelector).datum(d => d[axis]);
    const paths = group.selectAll('path').data(d => d);

    paths.enter()
      .append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .merge(paths)
      .transition(trans)
      .attr('stroke', d => scaleC(d.name))
      .attr('d', d => lineGenerator(d.rows));

    paths.exit().remove();
  }

  function renderAxis(sel, axisName, xTranslate, yTranslate) {
    const className = `axis-${axisName}`;
    const selector = `g.${className}`;
    const isY = axisName === 'left' || axisName === 'right';

    if (isY && mainData[axisName].length === 0) {
      sel.select(selector).remove();
      return;
    }

    if (sel.select(selector).size() === 0) {
      sel.append('g').attr('class', className);
    }

    sel.select(selector)
      .attr('transform', `translate(${xTranslate}, ${yTranslate})`)
      .call(axes[axisName].axis);
  }

  function mouseMove() {
    /**
     * Renders the Y value of each series in the legend if there is one near the mouse.
     *
     * The basic algorithm for finding the values we're hovered over:
     * Step 0: get the x position of the mouse, invert to get date value
     * Step 1: get closest x value in the array to my mouse
     * Step 2: get the scaled value of the closest x value
     * Step 3: render value if the scaled value is within 3 pixels of the mouse.
     */
    const chartEl = select(el);
    const bisectDate = bisector(d => d[0]).left;
    const scaleX = axes.x.scale;
    const posX = mouse(this)[0];
    const dateAtPos = scaleX.invert(posX);
    const values = {};

    if (chartEl.select('.d3-chart .vertical-indicator').size() === 0) {
      chartEl.select('.d3-chart').append('line')
        .attr('class', 'vertical-indicator')
        .lower(); // Have to use lower so the line renders behind the mouse overlay and does not trigger mouseOut.
    }

    chartEl.select('.d3-chart .vertical-indicator')
      .attr('x1', posX)
      .attr('x2', posX)
      .attr('y1', TOP_PADDING)
      .attr('y2', HEIGHT);

    [...mainData.left, ...mainData.right].forEach((series) => {
      const idx = bisectDate(series.rows, dateAtPos, 1);
      const leftRow = series.rows[idx - 1];
      const rightRow = series.rows[idx];
      let closestRow;

      if (leftRow === undefined && rightRow === undefined) {
        return;
      }

      if (rightRow === undefined) {
        closestRow = leftRow;
      } else {
        closestRow = dateAtPos - leftRow[X] > rightRow[X] - dateAtPos ? rightRow : leftRow;
      }

      if (Math.abs(scaleX(closestRow[X]) - posX) < 3 && closestRow[Y] !== null) {
        const x = closestRow[X];
        let y = isNaN(closestRow[Y]) ? closestRow[Y] : closestRow[Y].toFixed(2); // Limit numbers to 2 decimal points.
        const nameParts = series.name.split('.');
        const measure = nameParts[nameParts.length - 1];

        if (has.call(unitMap, measure)) {
          y += ` ${series[unitMap[measure]]}`; // Add units if applicable.
        }

        values[series.name] = [x, y];
      }
    });

    const legendItems = chartEl.select('.legend')
      .selectAll('.legend-row');

    legendItems.select('.legend-col--value')
      .text((d) => {
        const key = d[0];
        return has.call(values, key) ? values[key][Y] : '';
      });

    legendItems.select('.legend-col--date')
      .text((d) => {
        const key = d[0];
        let text = '';

        if (has.call(values, key)) {
          text = moment.utc(values[key][X]).format('YYYY-MM-DD h:mm:ss A');
        }

        return text;
      });
  }

  function mouseOut() {
    /**
     * Clears all legend values on mouseout
     */
    const chartEl = select(el);

    chartEl.select('.legend')
      .selectAll('.legend-row')
      .select('.legend-col--value')
      .text('');

    chartEl.select('.legend')
      .selectAll('.legend-row')
      .select('.legend-col--date')
      .text('');

    chartEl.select('.vertical-indicator')
      .remove();
  }

  function renderMouseOverlay(sel, dims) {
    const selector = 'rect.overlay';

    if (sel.select(selector).size() === 0) {
      sel.append('rect')
        .attr('class', 'overlay')
        .attr('opacity', 0.0);

      sel.select(selector)
        .on('mousemove', mouseMove)
        .on('mouseout', mouseOut);
    }

    sel.select(selector)
      .attr('width', dims.right - dims.left)
      .attr('height', dims.height - dims.top)
      .attr('x', dims.left)
      .attr('y', dims.top);
  }

  function renderMainChart(sel, dims, trans) {
    const selector = 'svg.d3-chart';

    if (sel.select(selector).size() === 0) {
      sel.append('svg').attr('class', 'd3-chart');
    }

    const scaleX = axes.x.scale;
    const scaleL = axes.left.scale;
    const scaleR = axes.right.scale;
    const rangeX = [dims.left, dims.right];
    const rangeY = [dims.bottom, dims.top];

    scaleX.range(rangeX);
    scaleL.range(rangeY);
    scaleR.range(rangeY);

    sel.select(selector).datum(mainData)
      .attr('width', `${dims.width}px`)
      .attr('height', `${dims.height}px`)
      .call(renderLines, 'left', scaleX, scaleL, trans)
      .call(renderLines, 'right', scaleX, scaleR, trans)
      // Have to subtract dims.top here because d3 Axis objects are default rendered to 0, 0
      .call(renderAxis, 'left', rangeX[0], rangeY[1] - dims.top)
      .call(renderAxis, 'right', rangeX[1], rangeY[1] - dims.top)
      .call(renderAxis, 'x', 0, rangeY[0])
      .call(renderMouseOverlay, dims);
  }

  chart.onBrush = (...args) => {
    const axis = axes.xPreview;

    if (!args.length) {
      return axis.onBrush;
    }

    axis.onBrush = args[0];
    axis.brush.on('brush', () => {
      const scaleX = axes.xPreview.scale;
      const range = event.selection === null ? null : event.selection.map(scaleX.invert, scaleX);

      axis.onBrush(range);
    });

    return chart;
  };

  chart.onBrushEnd = (...args) => {
    const axis = axes.xPreview;

    if (!args.length) {
      return axis.onBrushEnd;
    }

    axis.onBrushEnd = args[0];
    axis.brush.on('end', () => {
      if (event.sourceEvent === null) {
        // Don't trigger brush events if there is no sourceEvent, this means that the brush was programmatically set,
        // probably due to a re-render, so we want to prevent an infinite loop of brush events.
        return;
      }

      const scaleX = axis.scale;
      const range = event.selection === null ? null : event.selection.map(scaleX.invert, scaleX);

      axis.onBrushEnd(range);
    });

    return chart;
  };

  function renderBrush(sel, height, trans) {
    const selector = 'g.brush-area';
    const previewAxis = axes.xPreview;
    const xAxis = axes.x;
    const rangeX = previewAxis.scale.range();
    const previewBrush = previewAxis.brush;

    previewBrush.extent([[rangeX[0], 0], [rangeX[1], height]]);

    if (sel.select(selector).size() === 0) {
      sel.append('g').attr('class', 'brush-area');
    }

    sel.select(selector)
      .call(previewBrush);

    if ((xAxis.domain[0] - previewAxis.domain[0]) !== 0 || (xAxis.domain[1] - previewAxis.domain[1]) !== 0) {
      // Move the brush on re-render.
      sel.select(selector)
        .transition(trans)
        .call(previewBrush.move, xAxis.scale.domain().map(d => previewAxis.scale(d)));
    }
  }

  function renderPreview(sel, dims, trans) {
    const selector = 'svg.preview';
    const previewExists = sel.select(selector).size() > 0;

    if (previewData === null) {
      if (previewExists) {
        sel.select(selector).remove();
      }

      return;
    }

    if (!previewExists) {
      sel.append('svg').attr('class', 'preview');
    }

    const height = dims.previewHeight;
    const scaleL = axes.leftPreview.scale;
    const scaleR = axes.rightPreview.scale;
    const scaleX = axes.xPreview.scale;
    const rangeX = [dims.left, dims.right];
    const rangeY = [dims.previewBottom, dims.previewTop];

    scaleX.range(rangeX);
    scaleL.range(rangeY);
    scaleR.range(rangeY);

    sel.select(selector).datum(previewData)
      .attr('width', `${dims.width}px`)
      .attr('height', `${height}px`)
      .call(renderLines, 'left', scaleX, scaleL, trans)
      .call(renderLines, 'right', scaleX, scaleR, trans)
      .call(renderAxis, 'xPreview', 0, rangeY[0])
      .call(renderBrush, height, trans);
  }

  function renderLegend(sel) {
    // TODO: make it possible to hover over a legend item to emphasize a series.
    // TODO: make it possible to toggle emphasized series so you don't have to hover.
    const hasLeftAxis = mainData.left.length > 0 || previewData.left.length > 0;
    const hasRightAxis = mainData.right.length > 0 || previewData.right.length > 0;
    const hasBothAxes = hasLeftAxis && hasRightAxis;

    if (sel.select('table.legend').size() === 0) {
      const tbody = sel.append('table').attr('class', 'legend').append('tbody');
      tbody.append('th').attr('class', 'legend-header').text('color');

      if (hasLeftAxis && hasRightAxis) {
        tbody.append('th').attr('class', 'legend-header').text('axis');
      }

      tbody.append('th').attr('class', 'legend-header').text('environment');
      tbody.append('th').attr('class', 'legend-header').text('application');
      tbody.append('th').attr('class', 'legend-header').text('metric');
      tbody.append('th').attr('class', 'legend-header').text('measure');
    }

    const scale = axes.color.scale;
    const colors = scale.domain().map((colorKey) => {
      const parts = colorKey.split('.');
      const environment = parts[0];
      const application = parts[1];
      const metric = parts.slice(2, parts.length - 1).join('.');
      const measure = parts[parts.length - 1];
      let axis;

      if (hasBothAxes) {
        axis = findAxis(colorKey, mainData);

        if (axis === '') {
          axis = findAxis(colorKey, previewData);
        }
      }

      return [colorKey, environment, application, metric, measure, axis];
    });
    const items = sel.select('table.legend tbody').selectAll('tr.legend-row').data(colors);
    const newItems = items.enter().append('tr').attr('class', 'legend-row');
    const allItems = newItems.merge(items);

    newItems.append('td').attr('class', 'legend-col').append('div').attr('class', 'legend-swatch').html('&nbsp;');

    if (hasBothAxes) {
      newItems.append('td').attr('class', 'legend-col legend-col--axis');
      allItems.select('td.legend-col--axis').text(d => d[5]);
    }

    newItems.append('td').attr('class', 'legend-col legend-col--environment');
    newItems.append('td').attr('class', 'legend-col legend-col--application');
    newItems.append('td').attr('class', 'legend-col legend-col--metric');
    newItems.append('td').attr('class', 'legend-col legend-col--measure');
    newItems.append('td').attr('class', 'legend-col legend-col--value');
    newItems.append('td').attr('class', 'legend-col legend-col--date');
    allItems.select('.legend-swatch').attr('style', d => `background-color: ${scale(d[0])};`);
    allItems.select('td.legend-col--environment').text(d => d[1]);
    allItems.select('td.legend-col--application').text(d => d[2]);
    allItems.select('td.legend-col--metric').text(d => d[3]);
    allItems.select('td.legend-col--measure').text(d => d[4]);
    items.exit().remove();
  }

  chart.render = () => {
    const sel = select(el);
    const dims = calculateDimensions(el);
    const trans = transition().duration(1000);

    // Reset color scale to prevent weird behavior when main chart has more/less series than preview chart.
    axes.color.scale.domain([]);

    sel.call(renderMainChart, dims, trans)
      .call(renderPreview, dims, trans)
      .call(renderLegend);

    return chart;
  };

  return chart;
}
