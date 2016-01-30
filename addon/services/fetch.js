import Ember from 'ember';
import fetch from 'fetch';

export default Ember.Service.extend({
  fetch () {
    return fetch(...arguments);
  }
});
