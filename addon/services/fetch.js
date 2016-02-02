import Ember from 'ember';
import fetch from 'fetch';

const {
  RSVP,
  Service,
  testing
} = Ember;

export default Service.extend({
  __recordings: null,
  __shouldRecord: false,

  // TODO: don't assume 'input' is a string
  // TODO: tolerance for differences in query parameter ordering? might be the responsibility of
  // the consumer to order params consistently
  fetch (input, init = {}) {
    const doFetch = () => fetch(input, init);
    const recordResponse = response => {
      this.__setRecordingFor(input, init, response);
      return response;
    };

    if (!testing) {
      return doFetch();
    }

    let hasRecordings = !!this.get('__recordings');

    if (hasRecordings) {
      // check to see if we have a recording for this particular set of input
      if (this.__hasRecordingFor(input, init)) {
        return RSVP.resolve(this.__getRecordingFor(input, init).response.clone());
      }
      console.log('No recording for ', input);
    }

    if (this.get('__shouldRecord')) {
      console.log('Recording request for ', input);

      return doFetch().then(recordResponse, recordResponse);
    } else {
      return doFetch();
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
    let currentRecordings = this.get('__recordings');

    if (!currentRecordings) {
      currentRecordings = {};
    }

    if (this.__hasRecordingFor(input, init)) {
      Ember.Logger.warn(`A recording for the endpoint ${input} already exists - overwriting`);
    }

    currentRecordings[this.__keyForRecording(input, init)] = { fetchArgs: { input, init }, response: response.clone() };

    this.set('__recordings', currentRecordings);
  }
});
