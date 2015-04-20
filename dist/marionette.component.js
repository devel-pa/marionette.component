/**
 * marionette.component - Create and manage reusable components in Marionette.js
 * @version v0.0.1
 * @copyright (c) 2015 Jeremy Fairbank
 * @link https://github.com/jfairbank/marionette.component
 * @license ISC
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(["underscore","backbone.marionette"], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone.marionette'));
  } else {
    root.Marionette.Component = factory(root._, root.Marionette);
  }
}(this, function(_, Marionette) {

// Marionette.Component
// --------------------
// A reusable component object that encapsulates a view and maintains
// business logic on itself instead of the view. A `Marionette.Component`
// can have an optional model and collection too.

'use strict';

Marionette.Component = Marionette.Object.extend({
  constructor: function constructor(options) {
    options = options || {};

    this.model = options.model;
    this.collection = options.collection;

    Marionette.Object.prototype.constructor.apply(this, arguments);
  },

  // Show this component inside a region
  showIn: function showIn(region) {
    if (this._isShown) {
      throw new Error('This component is already shown in a region.');
    }

    if (!region) {
      throw new Error('Please supply a region to show inside.');
    }

    this.region = region;

    this.triggerMethod('before:show');

    this._showView();
    this._isShown = true;

    this.triggerMethod('show');
  },

  // Destroy the component and view
  destroy: function destroy() {
    if (this._isDestroyed) {
      return;
    }

    this.triggerMethod('before:destroy');

    this._destroyViewThroughRegion();
    this._removeReferences();

    this.triggerMethod('destroy');
    this.stopListening();

    this._isDestroyed = true;
  },

  // Show the view in the region
  _showView: function _showView() {
    var view = this.view = this._getView();

    this._initializeViewEvents();

    // Trigger show:view after the view is shown in the region
    this.listenTo(view, 'show', _.partial(this.triggerMethod, 'show:view'));

    // Trigger before:show before the region shows the view
    this.triggerMethod('before:show:view');

    // Show the view in the region
    this.region.show(view);

    // Destroy the component if the region is emptied because it destroys
    // the view
    this.listenToOnce(this.region, 'empty', this.destroy);
  },

  // Get an instance of the view to display
  _getView: function _getView() {
    var ViewClass = this.viewClass;

    if (!ViewClass) {
      throw new Error('You must specify a viewClass for your component.');
    }

    return new ViewClass(_.result(this, 'viewOptions'));
  },

  viewOptions: function viewOptions() {
    return {
      model: this.model,
      collection: this.collection
    };
  },

  // Set up events from the `viewEvents` hash
  _initializeViewEvents: function _initializeViewEvents() {
    if (this.viewEvents) {
      this.bindEntityEvents(this.view, this.viewEvents);
    }
  },

  // Destroy a view by emptying the region
  _destroyViewThroughRegion: function _destroyViewThroughRegion() {
    var region = this.region;

    // Don't do anything if there isn't a region or view.
    // We need to check the view or we could empty the region before we've
    // shown the component view. This would destroy an existing view in the
    // region.
    if (!region || !this.view) {
      return;
    }

    // Remove listeners on region, so we don't call `destroy` a second time
    this.stopListening(region);

    // Destroy the view by emptying the region
    region.empty();
  },

  // Remove references to all attached objects
  _removeReferences: function _removeReferences() {
    delete this.model;
    delete this.collection;
    delete this.region;
    delete this.view;
  }
});
return Marionette.Component;

}));
