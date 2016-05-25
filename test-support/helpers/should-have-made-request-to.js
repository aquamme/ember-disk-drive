import Ember from 'ember';
import actualContainsExpected from 'ember-disk-drive/utils/actual-contains-expected';

/*
  TODO
support checking post params
support using a regex
improve helper api
*/

function includesQueryParams(url, queryParams = {}) {
  return Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`).every(param => url.includes(param));
}

export default Ember.Test.registerAsyncHelper('shouldHaveMadeRequestTo', function(app, assert, method, path, expected) {
  let fetchService = app.__container__.lookup('service:fetch');

  let recordings = fetchService.get('__recordings');

  if (!recordings) {
    throw 'ember-disk-drive: no recordings found. Did you remember to wrap your test with `DiskDrive.useRecording`?';
  }

  let actual;

  let match = !!Object.keys(recordings).find(key => {
    if (key.includes(method.toUpperCase()) && key.includes(path)) {
      if (method.toUpperCase() === 'GET') {
        actual = key;
        return includesQueryParams(key, expected);
      } else if (method.toUpperCase() === 'POST') {
        actual = JSON.parse(recordings[key].fetchArgs.init.body);
        return actualContainsExpected(actual, expected);
      }
    }
    return false;
  });

  assert.ok(match, `A request to "${path}" was made with the correct params:
    Actual: ${JSON.stringify(actual)}
    Expected: ${JSON.stringify(expected)}
  `);
});
