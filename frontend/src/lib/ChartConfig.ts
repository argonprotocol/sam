import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const chartStartDate = dayjs.utc('2020-10-01T00:00:00.000Z');
export const chartEndDate = dayjs.utc('2025-12-31T23:59:59.999Z');

export const chartFill = {
  type: 'gradient',
  gradient: {
    shadeIntensity: 1,
    opacityFrom: 0.4,
    opacityTo: 0.1,
    stops: [0, 90, 100]
  }
};

export function createChartOptions(start: {
  chartType?: 'area' | 'line';
  yAxisMin?: number;
  yAxisMax?: number;
  strokeType?: 'dashed' | 'solid';
  currency?: string;
}) {
  const yAxisMin = start.yAxisMin || 0;
  const yAxisMax = start.yAxisMax || 1.25;
  return {
    colors: ['#61C054', '#63298E'],
    legend: {
      show: false,
    },
    chart: {
      id: 'chart',
      type: start.chartType || 'line',
      zoom: {
        enabled: false,
      },
      toolbar: {
        tools: {
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          download: false,
          selection: false,
          reset: false,
        },
      },
      animations: {
        enabled: false,
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      // dashArray: start.strokeType === 'dashed' ? 2 : 0,
      width: [4, 5],
    },
    grid: {
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
    },
    xaxis: {
      type: 'datetime',
      min: chartStartDate.valueOf(),
      max: chartEndDate.valueOf(),
      labels: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      min: yAxisMin,
      max: yAxisMax,
      labels: {
        show: false,
      },
    },
    fill: start.chartType === 'area' ? chartFill : {},
    tooltip: {
      enabled: false,
    },
  };
}