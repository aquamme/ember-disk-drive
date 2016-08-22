# Ember-disk-drive

## This prototype is not maintained. I recommend using [ember-cli-mirage](https://github.com/samselikoff/ember-cli-mirage) instead. 

A set of tools designed to faciliate the recording of API responses.
Includes
* ember-fetch service - must be used for a request to be recordable
* DiskDrive - used for selecting which recording to use in an acceptance test

#### Warning
I am using this addon in my own projects, but YMMV.
Only the minimum features have been added at this point. My short-term goal was to get as
close to my ideal API as possible - code quality (comments, SRP, naming, every other quality metric)
was not a focus. This should be considered a prototype, but I aim to make this addon more
robust in the future.

Disclaimer aside, I don't see the API changing much, so the addon should be safe to use
in that regard.

Here are the current known limitations:
* Only works in testing. It should be pretty easy to use this outside the test environment,
  but I don't have that need so I haven't worked on that feature.
* All recordings must be in the `/tests/recordings` directory - nesting inside deeper folders
  does not work. This should be easy to implement as well.
* The first argument to `fetch` is assumed to be a string containing the URI. The `fetch` API
  allows for a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object to be
  passed as the first arg. This shouldn't be too hard, but isn't a priority at the moment.
* Only JSON responses are supported at the moment.
* You cannot use the same recording name across tests while creating the recordings.

If that didn't scare you away, I'd be glad to hear any feedback - bug reports, feature requests,
and PRs are all welcome.

#### Some notes on design choices:
* While not currently a reality, [one day we might see acceptance tests running in parallel](http://discuss.emberjs.com/t/are-1ms-unit-tests-achievable/8169/3).
  This addon has been designed with that future in mind - that's why only requests made via
  the `fetch` service are recorded - it allows for the responses to be recorded in a non-global scope.

#### Planned features
* The ability to override a request with a fixture. This would be useful for testing
  error handling.
* The ability to seamlessly share recordings between tests

#### Who might find this addon useful?
While there are a few ember addons that already do something similar to this one, they each have
some drawbacks for my particular usecase. Some require that you emulate the behavior of your
backend in handcrafted routes, but this can be a large undertaking when building your app on complex APIs.
Some allow for responses to requests made during your tests to be recorded and played back, but
don't scope the recording to the individual tests - this can make managing your recordings
cumbersome as your test suite grows. `ember-disk-drive` aims to avoid these issues, but isn't
without its own drawback - using the provided fetch service is required for your requests to
be recorded.

## Installation

I haven't published this to npm yet as it's still in the early stages, so you'll need to

* Add a line in your package.json file that points to this repository
* `npm install`
* `bower install`

## Usage
After installing this addon, the fetch service should be available in your application.

```
import Ember from 'ember';

export default Ember.Route.extend({
  fetch: Ember.inject.service(),

  model () {
    // pardon the clunky syntax - suggestions welcome
    return this.get('fetch').fetch('/cool-stuff.json').then(response => response.json());
  }
});
```

The following example shows how to use this addon to record requests made using the fetch service.

```
import { moduleFor, test } from 'ember-qunit';
import DiskDrive from 'ember-disk-drive/disk-drive';

moduleFor('Acceptance: Application Route');

test('Cool stuff is shown', function (assert) {
  DiskDrive.useRecording({ recordingName: 'application-route', application: this.application }, function () {
    visit('/');

    andThen(function () {
      // assert stuff
    });
  });
});
```

All requests made will be saved in a file called 'application-route.js' and downloaded
once the test completes. Put the file in your `tests/recordings/` folder. The recorded
responses will be used when tests are run. Any requests that don't have a recorded response
will be passed through. If you wish to rerecord a test, simply delete the appropriate
recording first (in this case, `tests/recordings/application-route-recording.js`).

If making multiple recordings in a single session, your browser should prompt you to allow multiple files
to be downloaded.

Browser compatibility has not yet been tested - development is happening in Chrome. Saving new recordings
does not work in phantomjs, but existing recordings can be run.

## Running

* `ember server`
* Visit the dummy app at http://localhost:4200.

## Running Tests

* `npm test` (Runs `ember try:testall`)
* `ember test`
* `ember test --server`

