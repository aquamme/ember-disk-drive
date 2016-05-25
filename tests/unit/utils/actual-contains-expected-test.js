import actualContainsExpected from '../../../utils/actual-contains-expected';
import { module, test } from 'qunit';

module('Unit | Utility | actual contains expected');

const fixtures = [
  {
    actual: { a: 1, b: 2 },
    expected: { a: 1 },
    shouldBe: true
  },
  {
    actual: { a: 1, b: 2 },
    expected: { a: 2 },
    shouldBe: false
  },
  {
    actual: { a: 1, b: 2 },
    expected: { a: 2, c: 3 },
    shouldBe: false
  },
  {
    actual: { a: { x: 4, y: [1,2,3,4], z:234 }, b: 2 },
    expected: { a: { x: 4, y: [1,2,3] }, b: 2 },
    shouldBe: true
  },
];

// Replace this with your real tests.
test('it works', function(assert) {
  fixtures.forEach(f => assert[f.shouldBe ? 'ok' : 'notOk'](actualContainsExpected(f.actual, f.expected), `${JSON.stringify(f.actual)} ${JSON.stringify(f.expected)}`));
});
