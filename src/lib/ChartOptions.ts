import dayjs from "dayjs";
import { Chart, Interaction, TooltipModel } from 'chart.js';
import { getRelativePosition } from 'chart.js/helpers';

(Interaction.modes as any).myCustomMode = function(chart: any, e: any) {
  const position = getRelativePosition(e, chart);

  const items: any[] = [];
  Interaction.evaluateInteractionItems(chart, 'x', position, (element, datasetIndex, index) => {
    const xDistanceFromPoint = Math.abs(position.x - element.x);
    const yDistanceFromPoint = Math.abs(position.y - element.y);
    if (yDistanceFromPoint < 30 && xDistanceFromPoint < 30) {
      items.push({element, datasetIndex, index});
    }
  });
  return items;
};

export function createChartOptions(chartPoints: any[], pointRadius: number[], dollarPoints: any[], dollarPointRadius: number[], onTooltipFn: any, onEventFn: any) {
  return {
    type: 'line',
    data: {
      datasets: [
        {
          data: chartPoints,
          borderColor: '#63298E',
          borderWidth: 4,
          pointBorderColor: 'white',
          pointBorderWidth: 1,
          pointBackgroundColor: '#63298E',
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#9325E4',
          pointRadius: pointRadius,
        },
        {
          data: dollarPoints,
          borderColor: '#BDC2CE',
          borderWidth: 3,
          borderDash: [9, 5],
          pointBorderColor: 'white',
          pointBorderWidth: 1,
          pointBackgroundColor: '#BDC2CE',
          pointRadius: dollarPointRadius,
        },
      ]
    },
    options: {
      plugins: {
        tooltip: {
          backgroundColor: 'white',
          borderColor: '#979797',
          bodyColor: '#4C4C4C',
          titleColor: 'black',
          displayColors: false,
          borderWidth: 1,
          caretSize: 10,
          enabled: false,
          external: (context: any) => onTooltipFn(context.tooltip as TooltipModel<any>),
        }
      },
      interaction: {
        mode: 'myCustomMode',
        intersect: false,
      },
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 25,
          right: 25,
          top: 0,
          bottom: 0,
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day'
          },
          display: false,
          min: dayjs('2020-10-01').valueOf(),
          max: dayjs('2025-12-31').valueOf(),
        },
        y: {
          display: false,
          min: 0,
          max: 2.50,
        }
      },
      clip: false,
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'mousedown'],
    },
    plugins: [{
      id: 'myEventCatcher',
      afterEvent: onEventFn,
    }]
  };
}