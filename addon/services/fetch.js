import Ember from 'ember';
import fetch from 'fetch';

const {
  RSVP,
  Service,
  testing
} = Ember;

export default Service.extend({
  __recording: null,
  __shouldRecord: false,

  fetch (input, init = {}) {
    if (!testing) {
      return fetch(input, init);
    }

    let recording = this.get('__recording');
    if (recording) {
      // check to see if we have a recording for this particular set of input
      if (recording[input]) {
        return RSVP.resolve(recording[input].response);
      }
    }

    if (this.get('__shouldRecord')) {
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
    let currentRecordings = this.get('__recording');

    if (!currentRecordings) {
      currentRecordings = {};
    }

    if (currentRecordings[fetchArgs.input]) {
      Ember.Logger.warn(`A recording for the endpoint ${fetchArgs.input} already exists - overwriting`);
    }

    currentRecordings[fetchArgs.input] = { fetchArgs, response };

    this.set('__recording', currentRecordings);
  }
});
