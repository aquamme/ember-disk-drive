import Ember from 'ember';

/*
  TODO
support checking post params
support using a regex
improve helper api
*/

function includesQueryParams(url, queryParams = {}) {
  return Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`).every(param => url.includes(param));
}

export default Ember.Test.registerAsyncHelper('shouldHaveMadeRequestTo', function(app, assert, method, path, queryParams) {
  let fetchService = app.__container__.lookup('service:fetch');

  let recordings = fetchService.get('__recordings');

  if (!recordings) {
    throw 'ember-disk-drive: no recordings found. Did you remember to wrap your test with `DiskDrive.useRecording`?';
  }

  let match = !!Object.keys(recordings).find(key => {
    if (key.includes(method.toUpperCase()) && key.includes(path) && includesQueryParams(key, queryParams)) {
      return true;
    }
    return false;
  });

  assert.ok(match, `A request to "${path}" was made with the supplied query parameters`);
});
