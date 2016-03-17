/* global require, requirejs */
import Ember from 'ember';
import { Response } from 'fetch';

const {
  Logger,
  assert,
  run,
  testing
} = Ember;

const isDevelopingAddon = false;

const info = (() => isDevelopingAddon ? Logger.info(...arguments) : null);

export default {
  useRecording ({ recordingName, application }, callback) {
    // TODO: consider removing this restriction
    assert('useRecording may only be used in testing mode', testing);

    let fetchService = application.__container__.lookup('service:fetch');
    let existingRecording = recordingFor(recordingName);

    const setOnFetch = ((key, val) => run(() => fetchService.set(key, val)));

    setOnFetch('__shouldRecord', true);

    if (existingRecording) {
      existingRecording = buildResponseObjects(existingRecording);
      setOnFetch('__recordings', existingRecording);
    }

    setOnFetch('__recordingCompleteCallback', function () {
      let newRecordings = fetchService.get('__recordings');
      let hasNewRecordings = fetchService.get('__hasNewRecordings');
      if (hasNewRecordings) {
        convertToModule(newRecordings).then(recordings => downloadRecording(recordingName, recordings));
      } else {
        info('No new recordings to download. Something went wrong.');
      }
    });

    callback();
  }
};

// TODO: a more exact matching alg
// TODO: allow nested folders for recordings
function recordingFor (name) {
  let recordings = readRecordings();

  let fullKey = Object.keys(recordings).filter(key => {
    let keyPathFragments = key.split('/');

    return name === keyPathFragments[keyPathFragments.length -1];
  });

  assert('Should only find one match - fix the alg', fullKey.length <= 1);

  return recordings[fullKey[0]];
}

// Code and inspiration taken from ember-cli-mirage
function readRecordings () {
  let recordingsRegex = /\/tests\/recordings/;

  let modulesMap = {};
  Object.keys(requirejs._eak_seen)
    .filter(key => recordingsRegex.test(key))
    .filter(key => !/.jshint$/.test(key)) // filter jshint modules
    .forEach(moduleName => {
      let module = require(moduleName, null, null, true);
      if (!module) { throw new Error(moduleName + ' must export a recording'); }

      let data = module['default'];

      modulesMap[moduleName] = data;
    });

  return modulesMap;
}

function convertToModule (recordings = {}) {
  return serializeRecordings(recordings).then(recordings => ['export default {', recordings.join(','), '};']);
}

function buildResponseObjects (recordings) {
  Object.keys(recordings).forEach(key => {
    let ra = recordings[key].response;

    let headerMap = ra.init.headers.map;
    let headers = {};

    Object.keys(headerMap).forEach(key => {
      headers[key] = headerMap[key][0];
    });

    ra.init.headers = headers;

    recordings[key].response = new Response(JSON.stringify(ra.body), ra.init);
  });

  return recordings;
}

// TODO: get rid of object/array conversion funkiness
// TODO: don't assume the `input` param for fetch is a string
function serializeRecordings (recordings = {}) {
  return Promise.all(Object.keys(recordings).map(recordingKey => { //jshint ignore:line
    let recording = recordings[recordingKey];

    return convertRequestToPlainObject(recording.response).then(pojodResponse => {
      let ret = {
        fetchArgs: recording.fetchArgs,
        response: pojodResponse
      };

      return `"${recordingKey}":${JSON.stringify(ret)}`;
    });
  }));
}

// TODO: support more than just json
function convertRequestToPlainObject (request) {
  return convertRequestToJson(request).then(json => {
    return {
      body: json,
      init: {
        status: request.status,
        statusText: request.statusText,
        headers: request.headers,
      }
    };
  });
}

// Taken from the fetch polyfill to work around an issue where calling fileReaderReady can cause
// qunit.stop to be called outside of a test context, which throws an error, breaking the test suite
function convertRequestToJson (request) {
  // _bodyBlob is present if the request was made this session
  // _bodyText is present if the request was read from a previous recording
  if (request._bodyBlob) {
    let reader = new FileReader();
    reader.readAsText(request._bodyBlob);
    return fileReaderReady(reader).then(JSON.parse);
  } else {
    return Promise.resolve(JSON.parse(request._bodyText)); //jshint ignore:line
  }
}

function fileReaderReady(reader) {
  // Use the native Promise API here instead of RSVP to avoid calling qunit.stop
  return new Promise(function(resolve, reject) { //jshint ignore:line
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = function() {
      reject(reader.error);
    };
  });
}

// Code taken from ember-cli-betamax
function downloadRecording (name, data) {
  try {
    var blob = new window.Blob(data);
    var encodedUri = window.URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.style.display = 'none';

    document.body.appendChild(link);
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${name}.js`);
    link.click();
    document.body.removeChild(link);

    info('Downloading new recording:', name);
  } catch (e) {
    info('Could not download recording:', e.message);
  }
}
