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
    let isRecording;

    const setOnFetch = ((key, val) => run(() => fetchService.set(key, val)));

    if (existingRecording) {
      existingRecording = buildResponseObjects(existingRecording);
      setOnFetch('__recordings', existingRecording);
      isRecording = false;
    } else {
      isRecording = true;
    }

    setOnFetch('__shouldRecord', isRecording);
    setOnFetch('__recordingCompleteCallback', function () {
      if (isRecording) {
        let newRecordings = fetchService.get('__recordings');
        if (newRecordings) {
          convertToModule(newRecordings).then(recordings => downloadRecording(recordingName, recordings));
        } else {
          info('No new recordings to download. Something went wrong.');
        }
      } else {
        info('Did not record anything.');
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
  let reader = new FileReader();
  reader.readAsText(request._bodyBlob);
  return fileReaderReady(reader).then(JSON.parse);
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
