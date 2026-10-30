// app.js
import { baseColors } from "./config.js";
import { state, getLocalDateString } from "./state.js";
import { initFirebase } from "./firebase.js";
import { initCharts } from "./charts.js";
import { renderTable, toggleTableFullscreen, downloadCSV } from "./table.js";

setInterval(() => {
    const el = document.getElementById('header-time');
    if (el) el.textContent = new Date().toLocaleTimeString('es-MX', { hour12: false });
}, 1000);

export function setDateRange(type) {
    document.getElementById('date-end').value = getLocalDateString(0); 
    if (type === 'today') document.getElementById('date-start').value = getLocalDateString(0);
    else if (type === '7days') document.getElementById('date-start').value = getLocalDateString(-6);
    else if (type === '30days') document.getElementById('date-start').value = getLocalDateString(-29);
    
    if (state.allRecords.length > 0) processDataAndRender();
}

export function handleDropdownFilter() {
    const val = document.getElementById('filter-disposition').value;
    if (val === 'ALL') {
        clearInteractiveSelection();
    } else {
        state.activeDispositionContext = val;
        document.getElementById('lbl-active-filter').textContent = `${val}`;
        document.getElementById('btn-clear-filter').classList.remove('hidden');
        processDataAndRender();
    }
}

export function clearInteractiveSelection() {
    state.activeDispositionContext = null;
    const btn = document.getElementById('btn-clear-filter');
    if (btn) btn.classList.add('hidden');
    const f = document.getElementById('filter-disposition');
    if (f) f.value = 'ALL'; 
    
    if (state.chartDonut) {
        state.chartDonut.updateOptions({ colors: baseColors });
        setTimeout(() => {
            const paths = document.querySelectorAll('.apexcharts-pie-series path');
            paths.forEach(p => {
                p.removeAttribute('selected');
                p.removeAttribute('data:selected');
            });
        }, 10);
    }
    processDataAndRender();
}

export function processDataAndRender() {
    const startStr = document.getElementById('date-start').value;
    const endStr = document.getElementById('date-end').value;

    if (!startStr || !endStr) return;
    if (startStr > endStr) { 
        document.getElementById('date-start').value = endStr; 
        return processDataAndRender(); 
    }

    const rangeLbl = document.getElementById('lbl-trend-range');
    if (rangeLbl) rangeLbl.textContent = `${startStr.substring(5)} al ${endStr.substring(5)}`;

    let baseRecords = state.allRecords.filter(r => r.dateString >= startStr && r.dateString <= endStr);
    
    let activeTableRecords = baseRecords;
    if (state.activeDispositionContext) {
        activeTableRecords = activeTableRecords.filter(r => r.disposition === state.activeDispositionContext);
    }

    let stats = { total: 0, scrap: 0, retrabajo: 0 };
    baseRecords.forEach(r => {
        let q = parseInt(r.quantity) || 1;
        stats.total += q;
        if (r.disposition === 'Scrap') stats.scrap += q;
        else stats.retrabajo += q;
    });

    const kpiTotal = document.getElementById('kpi-total');
    if (kpiTotal) kpiTotal.textContent = state.activeDispositionContext ? (state.activeDispositionContext === 'Scrap' ? stats.scrap : stats.retrabajo) : stats.total;
    const kpiRegs = document.getElementById('kpi-registros');
    if (kpiRegs) kpiRegs.textContent = activeTableRecords.length;
    
    const panelScrap = document.getElementById('kpi-panel-scrap');
    if (panelScrap) {
        panelScrap.style.opacity = (!state.activeDispositionContext || state.activeDispositionContext === 'Scrap') ? '1' : '0.2';
        document.getElementById('kpi-scrap').textContent = stats.scrap;
    }
    const panelRetrabajo = document.getElementById('kpi-panel-retrabajo');
    if (panelRetrabajo) {
        panelRetrabajo.style.opacity = (!state.activeDispositionContext || state.activeDispositionContext === 'Retrabajo') ? '1' : '0.2';
        document.getElementById('kpi-retrabajo').textContent = stats.retrabajo;
    }

    if (state.chartDonut) {
        state.chartDonut.updateSeries([stats.scrap, stats.retrabajo]);
        if (state.activeDispositionContext) {
            const idx = state.activeDispositionContext === 'Scrap' ? 0 : 1;
            const focusedColors = baseColors.map((color, index) => index === idx ? color : '#2d313a');
            state.chartDonut.updateOptions({ colors: focusedColors });
        } else {
            state.chartDonut.updateOptions({ colors: baseColors });
        }
    }

    const centerEl = document.getElementById('donut-center');
    if (centerEl) {
        if (!state.activeDispositionContext) {
            centerEl.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            centerEl.style.borderColor = '#4b5563';
            centerEl.innerHTML = `
                <i class="fas fa-hand-pointer text-blue-400 text-3xl mb-1.5 pulse-icon drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"></i>
                <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center px-1">Click para<br>Filtrar</span>
            `;
        } else {
            const activeColor = state.activeDispositionContext === 'Scrap' ? '#ef4444' : '#f59e0b';
            centerEl.style.boxShadow = `0 0 25px ${activeColor}80, inset 0 0 15px rgba(0,0,0,0.9)`;
            centerEl.style.borderColor = activeColor;
            centerEl.innerHTML = `
                <span class="text-[12px] font-black px-3 py-1 rounded-full text-white bg-slate-800/80 mb-1 border border-current">${state.activeDispositionContext}</span>
                <span class="text-xs font-bold text-gray-300">${state.activeDispositionContext === 'Scrap' ? stats.scrap : stats.retrabajo} pzs</span>
            `;
        }
    }

    if (state.chartTrend) {
        let trendLabels = [];
        let currDate = new Date(startStr + 'T12:00:00'); 
        let endDateObj = new Date(endStr + 'T12:00:00');
        if (Math.ceil((endDateObj - currDate) / (1000 * 60 * 60 * 24)) > 60) { 
            currDate = new Date(endDateObj); 
            currDate.setDate(currDate.getDate() - 60); 
        }

        let seriesScrap = { name: 'Scrap', type: 'column', data: [], color: '#ef4444' };
        let seriesRetrabajo = { name: 'Retrabajo', type: 'column', data: [], color: '#f59e0b' };

        while (currDate <= endDateObj) {
            const dStr = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}-${String(currDate.getDate()).padStart(2, '0')}`;
            trendLabels.push(dStr.substring(5));
            const dayRecords = baseRecords.filter(r => r.dateString === dStr);
            
            let dailyScrap = 0, dailyRetrabajo = 0;
            dayRecords.forEach(r => {
                const q = parseInt(r.quantity) || 1;
                if (r.disposition === 'Scrap') dailyScrap += q;
                else dailyRetrabajo += q;
            });
            seriesScrap.data.push(dailyScrap);
            seriesRetrabajo.data.push(dailyRetrabajo);
            currDate.setDate(currDate.getDate() + 1);
        }

        let activeSeries = [];
        if (!state.activeDispositionContext || state.activeDispositionContext === 'Scrap') activeSeries.push(seriesScrap);
        if (!state.activeDispositionContext || state.activeDispositionContext === 'Retrabajo') activeSeries.push(seriesRetrabajo);

        state.chartTrend.updateOptions({ 
            chart: { stacked: true }, 
            xaxis: { categories: trendLabels },
            stroke: { width: [0, 0] }
        });
        state.chartTrend.updateSeries(activeSeries);
    }

    renderTable(activeTableRecords);
}

export function toggleFullscreen() { 
    if (!document.fullscreenElement) document.documentElement.requestFullscreen(); 
    else document.exitFullscreen(); 
}

window.setDateRange = setDateRange;
window.handleDropdownFilter = handleDropdownFilter;
window.clearInteractiveSelection = clearInteractiveSelection;
window.processDataAndRender = processDataAndRender;
window.toggleTableFullscreen = toggleTableFullscreen;
window.downloadCSV = downloadCSV;
window.toggleFullscreen = toggleFullscreen;

document.addEventListener('fullscreenchange', () => { 
    const btnFs = document.getElementById('btn-fullscreen');
    if (btnFs) {
        btnFs.innerHTML = !document.fullscreenElement 
            ? '<i class="fas fa-expand text-gray-400"></i>' 
            : '<i class="fas fa-compress text-blue-400"></i>'; 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date-start').value = getLocalDateString(0);
    document.getElementById('date-end').value = getLocalDateString(0);
    
    initCharts((selectedLabel) => {
        if (state.activeDispositionContext === selectedLabel) {
            clearInteractiveSelection();
        } else {
            state.activeDispositionContext = selectedLabel;
            const filterEl = document.getElementById('filter-disposition');
            if (filterEl) filterEl.value = selectedLabel;
            const lblEl = document.getElementById('lbl-active-filter');
            if (lblEl) lblEl.textContent = `${selectedLabel}`;
            const btnEl = document.getElementById('btn-clear-filter');
            if (btnEl) btnEl.classList.remove('hidden');
            processDataAndRender();
        }
    });

    initFirebase(() => {
        processDataAndRender();
    });
});
