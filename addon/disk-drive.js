/* global require, requirejs */
import Ember from 'ember';
import { Response } from 'fetch';

const { RSVP, assert, testing } = Ember;

export default {
  useRecording (name, application, callback) {
    // TODO: consider removing this restriction
    assert('useRecording may only be used in testing mode', testing);

    let fetchService = application.__container__.lookup('service:fetch');
    let recording = recordingFor(name);
    let isRecording;

    if (recording) {
      recording = buildResponseObjects(recording);
      fetchService.set('__recordings', recording);
      isRecording = false;
    } else {
      isRecording = true;
    }

    fetchService.set('__shouldRecord', isRecording);

    return new RSVP.Promise(resolve => callback(resolve)).finally(() => {
      if (isRecording) {
        let newRecordings = fetchService.get('__recordings');

        fetchService.set('__shouldRecord', false);

        //console.log(name);

        if (newRecordings) {
          convertToModule(newRecordings).then(recordings => {
            downloadRecording(name, recordings);
          });
        }
      }
    });
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
  return serializeRecordings(recordings).then(recordings => {
    recordings.unshift('export default ');
    recordings.push(';');
    return recordings;
  });
}

function buildResponseObjects (recordings) {
  Object.keys(recordings).map(key => {
    let ra = recordings[key].response;

    recordings[key].response = new Response(JSON.stringify(ra.body), ra.init);
  });

  return recordings;
}

// TODO: get rid of object/array conversion funkiness
// TODO: don't assume the `input` param for fetch is a string
function serializeRecordings (recordings = {}) {
  let recArr = Object.keys(recordings).map(key => recordings[key]);

  return RSVP.all(recArr.map(recording => {
    return convertRequestToPlainObject(recording.response).then(pojodResponse => {
      let ret = {};

      ret[recording.fetchArgs.input] = {
        fetchArgs: recording.fetchArgs,
        response: pojodResponse
      };

      return JSON.stringify(ret);
    });
  }));
}

// TODO: support more than just json
function convertRequestToPlainObject (request) {
  return request.json().then(json => {
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

function downloadRecording (name, data) {
  var blob = new window.Blob(data);
  var encodedUri = window.URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${name}.js`);
  link.click();

  console.log('Downloading new recording:', name);
}
