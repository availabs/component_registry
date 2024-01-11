import React from "react";
import {metaData} from "./config.js";
import {fnum} from "~/utils/macros.jsx";
const valueFormat = ({ cell, textCols = [], isDollar = false }) => {
    let value = cell?.value?.value?.join(", ") || cell.value || 0;


    return textCols.includes(cell?.column?.Header) ? value : fnum(value, isDollar);
};

export const cellFormat = (cell, type, col) => <div>
    {valueFormat({
        cell,
        textCols: metaData?.[type]?.textCols || [],
        isDollar: !(metaData?.[type]?.numCols || []).includes(col)
    })}
</div>