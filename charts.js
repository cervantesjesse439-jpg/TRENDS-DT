// charts.js
import { baseColors } from "./config.js";
import { state } from "./state.js";

export function initCharts(onDonutSelection) {
    const commonOptions = {
        chart: { background: 'transparent', toolbar: { show: false }, animations: { enabled: true, speed: 400 } },
        theme: { mode: 'dark' },
        grid: { borderColor: '#2d313a', strokeDashArray: 3, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
        tooltip: { theme: 'dark' }
    };

    const optionsDonut = {
        ...commonOptions,
        series: [0, 0],
        labels: ['Scrap', 'Retrabajo'],
        chart: { 
            ...commonOptions.chart, 
            type: 'donut', 
            height: '100%', 
            width: '100%',
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const label = config.w.globals.labels[config.dataPointIndex];
                    if (onDonutSelection) onDonutSelection(label);
                }
            }
        },
        plotOptions: {
            pie: { 
                expandOnClick: false,
                donut: { size: '75%', labels: { show: false } } 
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, colors: ['#15171e'], width: 3 }, 
        legend: { show: false }, 
        tooltip: { enabled: true, theme: 'dark', y: { formatter: val => `${val} Piezas` } },
        colors: baseColors,
        states: {
            hover: { filter: { type: 'lighten', value: 0.1 } }, 
            active: { filter: { type: 'none' } } 
        }
    };
    state.chartDonut = new ApexCharts(document.querySelector("#chart-donut-container"), optionsDonut);
    state.chartDonut.render();

    const optionsTrend = {
        ...commonOptions,
        series: [],
        chart: { ...commonOptions.chart, type: 'line', stacked: true, height: '100%', width: '100%' },
        stroke: { width: [0, 0], curve: 'smooth' }, 
        plotOptions: { bar: { columnWidth: '40%', borderRadius: 2 } },
        dataLabels: { enabled: false }, 
        xaxis: { 
            type: 'category', categories: [], 
            labels: { style: { colors: '#64748b', fontSize: '9px', fontWeight: 700 } }, 
            axisBorder: { show: false }, axisTicks: { show: false } 
        },
        yaxis: { show: true, labels: { style: { colors: '#64748b', fontSize: '10px', fontWeight: 700 } } },
        legend: { show: false }, 
    };
    optionsTrend.grid.padding.left = 10;
    state.chartTrend = new ApexCharts(document.querySelector("#chart-trend-container"), optionsTrend);
    state.chartTrend.render();
}
