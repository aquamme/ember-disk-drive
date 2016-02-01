/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-disk-drive',

  included: function (app) {
    this._super.included(app);

    // Hack to ensure nested addons are able to import their deps
    // See: https://github.com/hhff/spree-ember/blob/d9fc069aaf128e07593bd8dfc822926d85de92e0/packages/storefront/index.js#L9-L17
    // and https://github.com/ember-cli/ember-cli/issues/3718
    this.addons.forEach(function (addon) {
      if (addon.name.indexOf('fetch') >= 0) {
        addon.included.call(addon, app);
      }
    });
  }
};
