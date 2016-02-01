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
  fetch (input, init = {}) {
    if (!testing) {
      return fetch(input, init);
    }

    let recordings = this.get('__recordings'),
        hasRecordings = !!recordings;

    if (hasRecordings) {
      // check to see if we have a recording for this particular set of input
      if (recordings[input]) {
        return RSVP.resolve(recordings[input].response.clone());
      }
      console.log('No recording for ', input);
    }

    if (this.get('__shouldRecord')) {
      console.log('Recording request for ', input);

      return fetch(input, init).then(response => {
        this.__recordRequest({ input, init }, response);
        return response;
      }, response => {
        this.__recordRequest({ input, init }, response);
        return RSVP.reject(response);
      });
    } else {
      return fetch(input, init);
    }
  },

  __recordRequest (fetchArgs, response) {
    let currentRecordings = this.get('__recordings');

    if (!currentRecordings) {
      currentRecordings = {};
    }

    if (currentRecordings[fetchArgs.input]) {
      Ember.Logger.warn(`A recording for the endpoint ${fetchArgs.input} already exists - overwriting`);
    }

    currentRecordings[fetchArgs.input] = { fetchArgs, response: response.clone() };

    this.set('__recordings', currentRecordings);
  }
});
