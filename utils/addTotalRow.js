export const addTotalRow = ({showTotal, data, columns, setLoading}) => {
    // add total row
    if ((!showTotal?.length && !data.find(d => d.totalRow)) || !data?.length || !columns?.length) return;

    if(!showTotal?.length && data.find(d => d.totalRow)){
        const totalIndex = data.findIndex(d => d.totalRow)
        data.splice(totalIndex, 1)
        return;
    }
    setLoading(true);
    const totalRow = showTotal.reduce((acc, curr) => {
        acc[curr] = data.filter(d => !d.totalRow).reduce((acc, d) => acc + (+d[curr] || 0), 0);
        return acc;
    }, {})

    totalRow[columns[0].accessor] = 'Total';
    totalRow.totalRow = true;

    if (data.find(d => d.totalRow)) {
        const totalRowIndex = data.findIndex(d => d.totalRow);
        data[totalRowIndex] = totalRow;
    } else {
        data.push(totalRow)
    }
    console.log('show total', showTotal, totalRow, columns, data)
    setLoading(false)
}