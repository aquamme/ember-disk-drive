import Ember from 'ember';

const uri = 'http://jsonplaceholder.typicode.com';

export default Ember.Route.extend({
  fs: Ember.inject.service('fetch'),

  model () {
    return this.get('fs').fetch(uri + '/posts/1').then(response =>
      response.json());
  }
});
