import {fnum, fnumIndex} from "../../utils/macros.jsx";

export const formatFunctions = {
    'abbreviate': (d, isDollar) => fnumIndex(d, 1, isDollar),
    'comma': (d, isDollar) => fnum(d, isDollar)
}