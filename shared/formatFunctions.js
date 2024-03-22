import {fnum, fnumIndex} from "../../utils/macros.jsx";

export const formatFunctions = {
    'abbreviate': (d, isDollar) => fnumIndex(d, null, isDollar),
    'comma': (d, isDollar) => fnum(d, isDollar)
}