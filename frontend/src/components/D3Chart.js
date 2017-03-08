import { select, transition, scaleLinear, scaleLog, scaleOrdinal, scaleTime, schemeCategory10, extent, line, axisLeft,
  axisRight, axisBottom } from 'd3';
import { has } from '../utils';
import './D3Chart.css';

const SCALE_TYPES = { linear: true, log: true };
const X = 0;
const Y = 1;

// TODO: DEBUG DO NOT COMMIT
window.select = select;

// TODO: Move data transformation code to utils.js, including string -> date conversion
// TODO: Render legend
// TODO: Handle mouse over and render values to legend, or render all values in floating element near mouse.
//      https://bl.ocks.org/mbostock/3902569
// TODO: Render preview
// TODO: allow zoom on preview area
// TODO: add callbacks to zoom to re-query for data
// TODO: determine if we should format ticks similar to how it was done in Rickshaw where numbers were abbreviated
//        i.e. 1,000,000 -> 1M, 15,000 -> 15k
//        https://github.com/shutterstock/rickshaw/blob/master/src/js/Rickshaw.Fixtures.Number.js

function calculateXDomain(data) {
  /**
   * We have a separate function for calculating the x domain because we know it's sorted, so we don't need to scan
   * every value of each series to figure it out, just the first and last.
   */
  return data.reduce((domain, series) => {
    // First convert the series x values to dates.
    // TODO: remove this conversion, make the chart assume date conversion has already happened.
    series.rows.forEach(r => r[X] = new Date(r[X])); // eslint-disable-line no-param-reassign, no-return-assign
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
  // TODO: If the domain min and max are equal, if they are add/subtract 20% from min/max, or legends don't render
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

function calculateDimensions(element) {
  const bbox = element.getBoundingClientRect();
  const right = 30;
  const height = 300;
  const bottom = 30;

  return {
    height,
    top: 10,
    left: 30,
    bottom: height - bottom,
    width: bbox.width,
    right: bbox.width - right,
  };
}

export default function D3Chart(el) {
  const chart = {};
  let data;
  const axes = {
    x: {
      scale: scaleTime(),
      axis: axisBottom(),
      type: 'time',
    },
    left: {
      scale: scaleLinear(),
      axis: axisLeft(),
      type: 'linear',
    },
    right: {
      scale: scaleLinear(),
      axis: axisRight(),
      type: 'linear',
    },
    color: {
      scale: scaleOrdinal(schemeCategory10),
      type: 'color',
    },
  };

  // Initialize the axis objects with their appropriate scales.
  Object.values(axes).forEach((a) => {
    if (has.call(a, 'axis')) {
      a.axis.scale(a.scale);
    }
  });

  chart.data = (...args) => {
    /**
     * Data should be in the following format:
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
    if (!args.length) {
      return data;
    }

    const rawData = args[0];

    data = groupSeries(rawData);
    axes.x.scale.domain(calculateXDomain(rawData));
    axes.left.scale.domain(calculateYDomain(data.left)).nice();
    axes.right.scale.domain(calculateYDomain(data.right)).nice();
    axes.color.scale.domain(data.color);

    return chart;
  };

  function updateScale(axisName, ...args) {
    const axis = axes[axisName];

    if (!args.length) {
      return axis.type;
    }

    const scaleType = args[0];

    if (has.call(SCALE_TYPES, scaleType)) {
      axis.type = args[0];
    } else {
      throw new Error(`Invalid scale ${scaleType}, scale must be one of ${SCALE_TYPES}`);
    }

    const domain = axis.scale.domain();

    if (axis.type === 'log') {
      axis.scale = scaleLog();
      axis.axis.scale(axis.scale);
    } else {
      axis.scale = scaleLinear();
      axis.axis.scale(axis.scale);
    }

    axis.scale.domain(domain);

    return chart;
  }

  chart.yScale = (...args) => updateScale('left', ...args);
  chart.leftScale = (...args) => updateScale('left', ...args);
  chart.rightScale = (...args) => updateScale('right', ...args);

  function renderLines(sel, axis, trans) {
    const groupSelector = `g.${axis}`;
    const scaleX = axes.x.scale;
    const scaleY = axes[axis].scale;
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

    if (isY && data[axisName].length === 0) {
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

  function renderMainChart(sel, dims, trans) {
    if (sel.select('svg.chart').size() === 0) {
      sel.append('svg').attr('class', 'chart');
    }

    const scaleX = axes.x.scale;
    const scaleL = axes.left.scale;
    const scaleR = axes.right.scale;

    // Flip the y range because SVG 0,0 is top left not bottom left.
    scaleL.range([dims.bottom, dims.top]);
    scaleR.range([dims.bottom, dims.top]);
    scaleX.range([dims.left, dims.right]);

    sel.select('svg.chart').datum(data)
      .attr('width', `${dims.width}px`)
      .attr('height', `${dims.height}px`)
      .call(renderLines, 'left', trans)
      .call(renderLines, 'right', trans)
      .call(renderAxis, 'left', scaleX(scaleX.domain()[0]), scaleL(scaleL.domain()[1]) - dims.top)
      .call(renderAxis, 'right', scaleX(scaleX.domain()[1]), scaleR(scaleR.domain()[1]) - dims.top)
      .call(renderAxis, 'x', 0, scaleL(scaleL.domain()[0]));
  }


  function renderLegend(sel) {
    if (sel.select('ul.legend').size() === 0) {
      sel.append('ul').attr('class', 'legend');
    }

    const scale = axes.color.scale;
    const colors = scale.domain();
    const items = sel.select('ul.legend').selectAll('li.legend__item').data(colors);
    const newItems = items.enter().append('li').attr('class', 'legend__item');
    const allItems = newItems.merge(items);

    newItems.append('span').attr('class', 'swatch').html('&nbsp;');
    newItems.append('span').attr('class', 'name');
    allItems.select('span.name').text(d => d);
    allItems.select('span.swatch').attr('style', d => `background-color: ${scale(d)};`);
    items.exit().remove();
  }

  chart.render = () => {
    const sel = select(el);
    const dims = calculateDimensions(el);
    const trans = transition().duration(1000);

    sel.call(renderMainChart, dims, trans)
      .call(renderPreview, dims, trans)
      .call(renderLegend);

    return chart;
  };

  return chart;
}
