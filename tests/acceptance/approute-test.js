import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';
import DiskDrive from 'ember-disk-drive/disk-drive';

moduleForAcceptance('Acceptance | approute');

test('visiting /', function(assert) {
  DiskDrive.useRecording('app-route-recording', this.application, function (done) {
    visit('/');

    andThen(function() {
      assert.equal(currentURL(), '/');
      done();
    });
  });
});
