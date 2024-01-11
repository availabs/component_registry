import CENSUS_CONFIG from "./censusConfig.js"

import get from "lodash/get"

const DEFAULT_LAYOUT = {
  w: 12,
  h: 9,
  static: true
}

export const ACS_DATA_YEARS = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021]

export const maleColor = '#ff9999';
export const femaleColor = '#b3b3ff';

const keyRegex = /\w{6}(\w?)_(\d{3})\w/

const ALPHABET = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]

const expandKeys = keys => keys.reduce((a, c) => [...a, ...expandKeyRange(c)], []);

const expandKeyRange = key => {
  const split = key.split("...");
  if (split.length === 1) return split;
  const [start, end] = split,
    matchStart = keyRegex.exec(start),
    matchEnd = keyRegex.exec(end);

  if (matchStart[1] !== matchEnd[1] &&
      matchStart[2] === matchEnd[2]) {
    const s = matchStart[1],
      e = matchEnd[1],
      keys = [];
    let c = s;
    while (c <= e) {
      keys.push(start.replace(`${ s }_`, `${ c }_`));
      const index = ALPHABET.indexOf(c);
      c = ALPHABET[index + 1]
    }
    return keys;
  }
  else if (matchStart[2] !== matchEnd[2] &&
            matchStart[1] === matchEnd[1]) {
    const s = +matchStart[2],
      e = +matchEnd[2],
      keys = [];
    for (let i = s; i <= e; ++i) {
      keys.push(start.replace(`_${ matchStart[2] }`, `_${ (`000${ i }`).slice(-3) }`));
    }
    return keys;
  }
  return [start];
}

const processTreemap = node => {
  const children = get(node, "children", []);

  if (!children.length) {
    return [get(node, "censusKey")].filter(Boolean);
  }
  return children.reduce((a, c) => {
    a.push(...processTreemap(c));
    return a;
  }, []);
}

const processStackedBars = config => {

  const { bars, stackByYear, stacks } = config

  if (stackByYear && stacks) {
    return stacks.map(s => s.censusKey);
  }
  const censusKeys = [];

  for (const bar of bars) {
    for (const stack of bar.stacks) {
      censusKeys.push(stack.censusKey);
    }
  }
  return censusKeys;
}

export const configLoader = (BASE_CONFIG, props) => {

  const geoidLength = get(props, ["geoid", "length"], 0);

  const useCompact = window.innerWidth < 992;

  let x = 0, y = 0;

  const rects = [new Rect(0, -1, 12, 1)] // <-- this is the "ground" rect

  return BASE_CONFIG
    .filter(({ showForGeoidLength = geoidLength, hideWhenCompact = false }) => {
      return (showForGeoidLength === geoidLength) || (hideWhenCompact && useCompact);
    })
    .reduce((accum, baseConfig, index) => {
      const config = JSON.parse(JSON.stringify(baseConfig));

      // if (config.hideWhenCompact && useCompact) return accum;

      if (config.type === "ProfileFooter" || config.type === "ProfileHeader") return config;

      if (config["broadCensusKey"]) {
        const bk = CENSUS_CONFIG[config["broadCensusKey"]];
        config.censusKeys = bk.variables.map(v => v.value);
        // config.getKeyName = key => bk.variables.reduce((a, c) => c.value === key ? c.name : a, key)
        config.name = bk.name;
        config.title = bk.name;
      }

      if (config["left"] && config["left"].keys && config["right"] && config["right"].keys) {
        config["left"].keys =  expandKeys(config["left"].keys);
        config["right"].keys =  expandKeys(config["right"].keys);
        config["censusKeys"] = [...config["left"].keys, ...config["right"].keys];
      }
      if (config["left"] && config["left"].slice && config.censusKeys) {
        config["left"].keys = config.censusKeys.slice(...config["left"].slice);
      }
      if (config["right"] && config["right"].slice && config.censusKeys) {
        config["right"].keys = config.censusKeys.slice(...config["right"].slice);
      }

      if (config["censusKey"] && !config.censusKeys) {
        config.censusKeys = [config.censusKey];
      }
      if (config["divisorKey"] && !config.divisorKeys) {
        config.divisorKeys = [config.divisorKey];
      }

      if (config.type === "CensusTreemap") {
        config.censusKeys = processTreemap(config.tree);
  // console.log("CensusTreemap", config.censusKeys);
      }
      if (config.type === "CensusStackedBarChart") {
        config.censusKeys = processStackedBars(config);
      }

      if (config["censusKeys"]) {
        config.censusKeys = expandKeys(config.censusKeys);
      }
      if (config["divisorKeys"]) {
        config.divisorKeys = expandKeys(config.divisorKeys);
      }
      if (config["subtractKeys"]) {
        config.subtractKeys = expandKeys(config.subtractKeys);
      }

      if (config["censusKeys"]) {
        config.censusKeysMoE = config.censusKeys.reduce((a, c) => {
          const regex = /(.+)E$/;
          if (regex.test(c)) {
            a.push(c.replace(regex, (match, p1) => p1 + "M"))
          }
          return a;
        }, [])
      }
      if (config["divisorKeys"]) {
        config.divisorKeysMoE = config.divisorKeys.reduce((a, c) => {
          const regex = /(.+)E$/;
          if (regex.test(c)) {
            a.push(c.replace(regex, (match, p1) => p1 + "M"))
          }
          return a;
        }, [])
      }
      if (config["subtractKeys"]) {
        config.subtractKeysMoE = config.subtractKeys.reduce((a, c) => {
          const regex = /(.+)E$/;
          if (regex.test(c)) {
            a.push(c.replace(regex, (match, p1) => p1 + "M"))
          }
          return a;
        }, [])
      }

      if (config["divisorKeys"] && !config["yFormat"]) {
        config.yFormat = ",.1%";
      }

      const layout = Object.assign({}, DEFAULT_LAYOUT, config.layout)

      if (useCompact) {
        layout.x = 0;
        layout.w = 3;
        layout.y = y;
        layout.h = config.type === "CensusStatBox" ? 4 : layout.h;
        config.layout = layout;
        y += layout.h;
      }
      else {
        layout.w = Math.min(12, layout.w);

        if (layout.x !== undefined) {
          x = layout.x;
        }
        else if ((x + layout.w) > 12) {
          x = 0;
        }

        if (layout.y !== undefined) {
          y = layout.y;
        }
        const rect = new Rect(x, y, layout.w, layout.h);

        while (isIntersecting(rect, rects)) {
          rect.translateY(1);
        }

        if (layout.y === undefined) {
          applyGravity(rect, rects);
        }
        rects.push(rect);

        config.layout = rect.getLayout();
        x += rect.w;
        y = rects.reduce((a, c) => Math.max(c.bottom(), a), y);
      }

      accum.push(config);
      return accum;
    }, [])
}

export const processBaseConfig = (BASE_GRAPH_CONFIG, props) =>
  Object.keys(BASE_GRAPH_CONFIG)
    .reduce((a, c) => {
      a[c] = configLoader(BASE_GRAPH_CONFIG[c], props);
      return a;
    }, {})

const isIntersecting = (rect, others) =>
  others.reduce((a, c) => a || c.intersects(rect), false)

const applyGravity = (rect, others) => {
  rect.translateY(-1);

  while (!isIntersecting(rect, others)) {
    rect.translateY(-1);
  }
  rect.translateY(1);
}

class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  getLayout() {
    return {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h
    }
  }
  top() {
    return this.y;
  }
  bottom() {
    return this.y + this.h;
  }
  left() {
    return this.x;
  }
  right() {
    return this.x + this.w;
  }
  translate(x, y) {
    this.x += x;
    this.y += y;
  }
  translateX(x) {
    this.translate(x, 0);
  }
  translateY(y) {
    this.translate(0, y);
  }
  intersects(other) {
    if (this.right() <= other.left()) return false;
    if (this.left() >= other.right()) return false;
    if (this.bottom() <= other.top()) return false;
    if (this.top() >= other.bottom()) return false;
    return true;
  }
}

export const getCensusKeyLabel = (key, acsGraph, removeLeading = 0) => {
  const name = get(acsGraph, ["meta", key, "label"], key);
  if (typeof name !== "string") return key;

  let split = name.split("!!");
  if (split.length > removeLeading) {
    split = split.slice(removeLeading);
  }
  return split.join(", ")
}
