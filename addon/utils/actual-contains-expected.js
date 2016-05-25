function ace (actual, expected) {
  let isArray = Array.isArray(actual);
  let isPlainObject = typeof actual === 'object' && actual !== null;

  if (isPlainObject) {
    let akeys = Object.keys(actual);
    let ekeys = Object.keys(expected);

    return akeys >= ekeys && ekeys.every(ekey => ace(actual[ekey], expected[ekey]));
  }

  if (isArray) {
    let eq = true;
    for (let i = 0; i < expected.length; i += 1) {
      eq = eq && ace(actual[i], expected[i]);
    }
    return eq;
  }

  // primitives
  return actual === expected;
}

export default function actualContainsExpected(actual, expected) {
  return ace(actual, expected);
}
