// state.js
export const state = {
    allRecords: [],
    chartDonut: null,
    chartTrend: null,
    activeDispositionContext: null,
    isTableExpanded: false
};

export const getLocalDateString = (offsetDays = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
