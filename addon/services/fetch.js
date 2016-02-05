import Ember from 'ember';
import fetch from 'fetch';

const {
  Logger,
  RSVP,
  Service,
  run,
  testing
} = Ember;

const isDevelopingAddon = false;

const info = (() => isDevelopingAddon ? Logger.info(...arguments) : null);

export default Service.extend({
  __recordings: null,
  __shouldRecord: false,

  willDestroy () {
    this.__recordingCompleteCallback(this.get('__recordings'));
  },

  // TODO: don't assume 'input' is a string
  // TODO: tolerance for differences in query parameter ordering? might be the responsibility of
  // the consumer to order params consistently
  fetch (input, init = {}) {
    const recordResponse = response => {
      if (this.get('isDestroyed') || this.get('isDestroying')) {
        throw new Error(`ember-disk-drive - the following request completed after the fetch service was destroyed: ${input}`);
      }
      this.__setRecordingFor(input, init, response);
      return response;
    };

    if (!testing) {
      return fetch(input, init);
    }

    let hasRecordings = !!this.get('__recordings');

    if (hasRecordings) {
      // check to see if we have a recording for this particular set of input
      if (this.__hasRecordingFor(input, init)) {
        return RSVP.resolve(this.__getRecordingFor(input, init).response.clone());
      }
      info('No recording for ', input);
    }

    if (this.get('__shouldRecord')) {
      info('Recording request for ', input);

      return fetch(input, init).then(recordResponse);
    } else {
      return fetch(input, init);
    }
  },

  __hasRecordingFor (input, init) {
    return !!this.__getRecordingFor(input, init);
  },

  __getRecordingFor (input, init) {
    return (this.get('__recordings') || {})[this.__keyForRecording(input, init)];
  },

  __keyForRecording (input, init) {
    let method = (init.method || 'get').toUpperCase();
    return `${method}+${input}`;
  },

  __setRecordingFor (input, init, response) {
    run(() => {
      let currentRecordings = this.get('__recordings');

      if (!currentRecordings) {
        currentRecordings = {};
      }

      if (this.__hasRecordingFor(input, init)) {
        Ember.Logger.warn(`A recording for the endpoint ${input} already exists - overwriting`);
      }

      currentRecordings[this.__keyForRecording(input, init)] = { fetchArgs: { input, init }, response: response.clone() };

      if (this.get('isDestroyed')) {
        throw new Error(`The ember-disk-drive fetch service was destroyed before all network requests finished. You need to wrap any code with asynchronous side-effects in an Ember.run. Request URL: ${input}`);
      } else {
        this.set('__recordings', currentRecordings);
      }
    });
  }
});
