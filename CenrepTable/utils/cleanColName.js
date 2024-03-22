export const cleanColName = colName => colName.includes(' AS') ? colName.split(' AS')[0] : colName.split(' as')[0];
