import {getNestedValue} from "../../utils/getNestedValue.js";

export const handleExpandableRows = (data, columns, fn) => {
    const expandableColumns = columns.filter(c => c.openOut);
    if (expandableColumns?.length) {
        const newData = data.map(row => {
            const newRow = {...row}
            newRow.expand = []
            newRow.expand.push(
                ...expandableColumns
                    .map(col => {
                        const value = getNestedValue(row[col.accessor]);

                        return {
                            key: col.Header || col.display_name || col.name,
                            accessor: col.accessor,
                            value: Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? '' : value, // to display arrays
                            originalValue: Array.isArray(value) ? value : typeof value === 'object' ? '' : value // to filter arrays
                        }
                    })
            )
            expandableColumns.forEach(col => delete newRow[col.accessor])
            return newRow;
        })
        return newData;
    } else {
        return data
    }
}