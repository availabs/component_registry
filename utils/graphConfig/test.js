const keyRegex = /\w{6}(\w?)_(\d{3})\w/

const ALPHABET = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]

const expandKeys = keys =>
  keys.reduce((a, c) => [...a, ...expandKeyRange(c)], [])
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

const test = () => {
  const test1 = ["123456_001E...123456_010E"],
    test2 = ["123456A_001E...123456E_001E"];

  console.log("TEST 1", expandKeys(test1));
  console.log("TEST 2", expandKeys(test2));
}

test()
