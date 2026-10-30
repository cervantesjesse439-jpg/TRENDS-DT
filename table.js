// table.js
import { state } from "./state.js";

export function renderTable(records) {
    const tbody = document.getElementById('table-body');
    const emptyState = document.getElementById('table-empty-state');
    const recordCount = document.getElementById('table-record-count');
    if (recordCount) recordCount.textContent = `${records.length} EVENTOS`;

    if (records.length === 0) { 
        if (tbody) tbody.innerHTML = ''; 
        if (emptyState) emptyState.classList.remove('hidden'); 
        return; 
    }
    if (emptyState) emptyState.classList.add('hidden');
    
    const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

    if (tbody) {
        tbody.innerHTML = sortedRecords.map(r => {
            const dObj = new Date(r.timestamp);
            const timeStr = `${dObj.toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit'})} <span class="text-gray-600 mx-1">|</span> ${dObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
            const isScrap = r.disposition === 'Scrap';
            const badgeColor = isScrap ? 'bg-red-900/30 text-red-400 border-red-800/50' : 'bg-amber-900/30 text-amber-400 border-amber-800/50';

            return `<tr>
                <td class="font-condensed text-gray-400 text-[11px]">${timeStr}</td>
                <td class="font-bold"><span class="${badgeColor} border px-2 py-0.5 rounded text-[9px] tracking-widest uppercase shadow-sm">${r.disposition}</span></td>
                <td class="text-gray-300 font-bold">${r.part || 'AEN75467211'}</td>
                <td class="text-gray-400 text-xs">${r.model || 'DT housing'}</td>
                <td class="text-center font-condensed text-white text-sm font-bold bg-[#1a1c23]/50 border-x border-[#2d313a]">${r.quantity || 1}</td>
                <td class="text-gray-500 text-[10px] uppercase font-bold truncate max-w-[120px]"><i class="fas fa-user-tag text-gray-700 mr-1"></i> ${r.inspectorName || 'ANÓNIMO'}</td>
            </tr>`;
        }).join('');
    }
}

export function toggleTableFullscreen() {
    state.isTableExpanded = !state.isTableExpanded;
    const wrapper = document.getElementById('table-card-wrapper');
    const icon = document.getElementById('expand-icon');
    const text = document.getElementById('expand-text');
    const scrollArea = document.getElementById('table-scroll-area');

    if (!wrapper) return;

    if (state.isTableExpanded) {
        wrapper.classList.add('table-fullscreen');
        if (icon) icon.className = 'fas fa-compress-alt';
        if (text) text.textContent = 'Minimizar';
        if (scrollArea) scrollArea.style.maxHeight = 'none';
    } else {
        wrapper.classList.remove('table-fullscreen');
        if (icon) icon.className = 'fas fa-expand-alt';
        if (text) text.textContent = 'Expandir';
    }
}

export function downloadCSV() {
    if (state.allRecords.length === 0) return alert("No hay datos para exportar.");
    const startStr = document.getElementById('date-start').value; 
    const endStr = document.getElementById('date-end').value;
    
    let exportData = state.allRecords.filter(r => r.dateString >= startStr && r.dateString <= endStr);
    if (state.activeDispositionContext) {
        exportData = exportData.filter(r => r.disposition === state.activeDispositionContext);
    }
    
    const headers = ['FECHA', 'HORA', 'DISPOSICION', 'PARTE', 'MODELO', 'CANTIDAD', 'INSPECTOR'];
    const rows = exportData.sort((a, b) => b.timestamp - a.timestamp).map(r => {
        const d = new Date(r.timestamp);
        return [
            d.toLocaleDateString('es-MX'), 
            d.toLocaleTimeString('es-MX'), 
            r.disposition, 
            r.part || 'AEN75467211', 
            r.model || 'DT housing', 
            r.quantity || 1, 
            r.inspectorName || 'Anónimo'
        ].map(v => `"${v}"`).join(',');
    });

    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(new Blob(["\ufeff", [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })));
    link.setAttribute("download", `Export_DT_Housing_${state.activeDispositionContext || 'GLOBAL'}_${startStr}.csv`); 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
}
