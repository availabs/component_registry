import get from "lodash/get";
import {format as d3format} from "d3-format";

export const isJson = (str)  => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export const HoverComp = ({ data, keys, indexFormat, keyFormat, valueFormat }) => {
    return (
        <div className={`
      flex flex-col px-2 pt-1 rounded bg-white
      ${keys?.length <= 1 ? "pb-2" : "pb-1"}`}>
            <div className="font-bold text-lg leading-6 border-b-2 mb-1 pl-2">
                {indexFormat(get(data, "index", null))}
            </div>
            {keys.slice()
                // .filter(k => get(data, ["data", k], 0) > 0)
                .filter(key => data.key === key || get(data, ["data", key], 0) > 0)
                .reverse().map(key => (
                    <div key={key} className={`
            flex items-center px-2 border-2 rounded transition
            ${data.key === key ? "border-current" : "border-transparent"}
          `}>
                        <div className="mr-2 rounded-sm color-square w-5 h-5"
                             style={{
                                 backgroundColor: get(data, ["barValues", key, "color"], null),
                                 opacity: data.key === key ? 1 : 0.2
                             }} />
                        <div className="mr-4">
                            {keyFormat(key)}:
                        </div>
                        <div className="text-right flex-1">
                            {valueFormat(get(data, ["data", key], 0))}
                        </div>
                    </div>
                ))
            }
            {keys?.length <= 1 ? null :
                <div className="flex pr-2">
                    <div className="w-5 mr-2" />
                    <div className="mr-4 pl-2">
                        Total:
                    </div>
                    <div className="flex-1 text-right">
                        {valueFormat(keys.reduce((a, c) => a + get(data, ["data", c], 0), 0))}
                    </div>
                </div>
            }
        </div>
    );
};

export const d3Formatter = (format = '0.2', currency = false) => {
    const prefix = currency ? '$' : '';
    const suffix = d =>
        d >= 1_000_000_000_000_000 ? 'Q' :
            d >= 1_000_000_000_000 ? 'T' :
                d >= 1_000_000_000 ? 'B' :
                    d >= 1_000_000 ? 'M' :
                        d >= 1_000 ? 'K' : '';
    const cleanup = d => +d < 1 ? +d3format('0.1r')(+d) : d3format(format)(+d).toString().replace(/[a-z]*[A-Z]*/g, '');

    return d => `${prefix} ${cleanup(d)}${suffix(d)}`;
}

export const fnumIndex = (d, fractions = 2, currency = false) => {
    if(isNaN(d)) return 'No Data'
    if(typeof d === 'number' && d < 1) return `${currency ? '$' : ``} ${d?.toFixed(fractions)}`
        if (d >= 1_000_000_000_000_000) {
            return `${currency ? '$' : ``} ${(d / 1_000_000_000_000_000).toFixed(fractions)} Q`;
        }else if (d >= 1_000_000_000_000) {
            return `${currency ? '$' : ``} ${(d / 1_000_000_000_000).toFixed(fractions)} T`;
        } else if (d >= 1_000_000_000) {
            return `${currency ? '$' : ``} ${(d / 1_000_000_000).toFixed(fractions)} B`;
        } else if (d >= 1_000_000) {
            return `${currency ? '$' : ``} ${(d / 1_000_000).toFixed(fractions)} M`;
        } else if (d >= 1_000) {
            return `${currency ? '$' : ``} ${(d / 1_000).toFixed(fractions)} K`;
        } else {
            return typeof d === "object" ? `` : `${currency ? '$' : ``} ${parseInt(d)}`;
        }
    }
;

export const fnumToNumber = (d) => {
    const [number, letter] = d.replace('$', '').trim().split(' ');

    const multipliers = {
        k: 1_000,
        m: 1_000_000,
        b: 1_000_000_000,
        t: 1_000_000_000_000,
        q: 1_000_000_000_000_000
    }

    return +number * multipliers[letter.toLowerCase() || 1];
}

export const fnum = (number, currency = false) => `${currency ? '$ ' : ''} ${isNaN(number) ? 0 : parseInt(number).toLocaleString()}`;

export const formatDate = (dateString) => {
    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
        
    };
    return dateString ? new Date(dateString).toLocaleDateString(undefined, options) : ``;
};

export const range = (start, end) => Array.from({length: (end + 1 - start)}, (v, k) => k + start);

