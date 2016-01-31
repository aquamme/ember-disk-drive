/* global require, requirejs */
import Ember from 'ember';

const { RSVP, assert, testing } = Ember;

export default {
  useRecording (name, application, callback) {
    // TODO: consider removing this restriction
    assert('useRecording may only be used in testing mode', testing);

    let fetchService = application.__container__.lookup('service:fetch');
    let recording = recordingFor(name);
    let isRecording;

    if (recording) {
      fetchService.set('__recording', recording);
      isRecording = false;
    } else {
      isRecording = true;
    }

    fetchService.set('__shouldRecord', isRecording);

    return new RSVP.Promise(resolve => callback(resolve)).finally(() => {
      if (isRecording) {
        let newRecording = fetchService.get('__recording');

        fetchService.set('__shouldRecord', false);

        console.log(name);
        console.log(newRecording);
      }
    });
  }
};

function recordingFor (name) {
  let recordings = readRecordings();

  return recordings[name];
}

// Code and inspiration taken from ember-cli-mirage
function readRecordings () {
  let recordingsRegex = /\/tests\/recordings/;

  let modulesMap = {};
  Object.keys(requirejs._eak_seen)
    .filter(key => recordingsRegex.test(key))
    .forEach(moduleName => {
      let module = require(moduleName, null, null, true);
      if (!module) { throw new Error(moduleName + ' must export a recording'); }

      let data = module['default'];

      modulesMap[moduleName] = data;
    });

  return modulesMap;
}
