/*global $, navigator, _gaq, formLoaded, window*/

/**
 * Core object. Contains regularly used scripts for rapid deployment & easy updates.
 *
 * @version 0.3.2
 *
 * @property {function} init     A function to initialize all of the CORE functions.
 * @property {object}   browser  A collection of boolean values about the browser.
 * @property {object}   device   A collection of boolean values about the device.
 * @property {function} balance  A function to balance the height of two elements.
 * @property {object}   Forms    An object to manage forms.
 * @property {object}   Overlay  An object to manage overlays.
 * @property {object}   ShowHide An object to manage showing and hiding content.
 *
 * @author Adam Leder    <aleder@fingerpaintmarketing.com>
 * @author Beau Watson   <bwatson@fingerpaintmarketing.com>
 * @author Chris O'Brien <cobrien@fingerpaintmarketing.com>
 * @author Kevin Fodness <kfodness@fingerpaintmarketing.com>

 * @uses Google Analytics
 * @uses InFieldLabels 0.1.2 (http://fuelyourcoding.com/scripts/infield/)
 * @uses jQuery 1.7.2 (bundled with jQuery tools)
 * @uses jQuery Tools Full 1.2.7 (http://jquerytools.org/)
 * @uses jqZoom 2.3 (http://www.mind-projects.it/projects/jqzoom/)
 * @uses To Title Case 2.0.1 (https://github.com/gouch/to-title-case)
 */
var CORE = {

  /**
   * Initialize function. Initializes all CORE functionality.
   *
   * Individual CORE functions can be initialized by calling their individual
   * .init() function.
   */
  init: function () {
    this.Expand.init();
    this.Forms.init();
    this.Overlay.init();
    this.ShowHide.init();
    this.ToolTip.init();
    this.Zoom.init();
  },

  /**
   * Object containing boolean flags for the current browser.
   *
   * @type object
   *
   * @uses jQuery
   */
  browser: {
    isIE: ($.browser.msie !== undefined),
    isIE6: ($.browser.version.substr(0, 1) === '6'),
    isIE7: ($.browser.version.substr(0, 1) === '7'),
    isIE8: ($.browser.version.substr(0, 1) === '8'),
    isIE9: ($.browser.version.substr(0, 1) === '9'),
    isIE10: ($.browser.version.substr(0, 1) === '10')
  },

  /**
   * Object containing boolean flags for the current device.
   *
   * @type object
   */
  device: {
    isMobile: (/iphone|ipad|ipod|android|blackberry|mini|mobi|windows\s(ce|phone)|iemobile|palm|mobile/i.test(navigator.userAgent.toLowerCase())),
    isIpad: (navigator.userAgent.match(/iPad/i)),
    isIphone: (navigator.userAgent.match(/iPhone/i))
  },

  /**
   * Column balance function - makes a pair of columns the same height.
   *
   * @param string element1 The jQuery search string for the first element.
   * @param string element2 The jQuery search string for the first element.
   *
   * @uses jQuery
   */
  balance: function (element1, element2) {
    var $element1 = $(element1);
    var $element2 = $(element2);
    var balancedHeight = Math.max($element1.innerHeight(), $element2.innerHeight());
    $element1.height(balancedHeight - ($element1.innerHeight() - $element1.height()));
    $element2.height(balancedHeight - ($element2.innerHeight() - $element2.height()));
  },

  /**
   * Handles toggling visibility of content using the jQuery Xpander plugin by Adam.
   *
   * @property {object}   settings Supplemental settings for the plugin.
   * @property {function} init     Initializes the ShowHide functionality.
   *
   * @type {Object}
   * @uses jQuery
   */
  Expand: {
    settings: { },
    init: function () {
      var $expand = $('.xpander');
      if ($expand.length) {
        $expand.xpander(this.settings);
      }
    }
  },

  /**
   * Forms object - handles form validation and Google Analytics tracking.
   *
   * @property {object}   validatorSettings   Settings for the jQuery Tools form validator. Can be overriden in script.js.
   * @property {function} bindValidation      Adds validation to a form.
   * @property {function} enableInFieldLabels Turns on inFieldLabels if the setting is enabled.
   * @property {function} init                Sets up validation for all forms found on the page at load-time.
   *
   * @type {Object}
   * @uses jQuery
   * @uses jQuery Tools [For validating form submissions.]
   * @uses inFieldLabels [For displaying labels inside text boxes.]
   * @uses Google Analytics [For pushing submit events to Google Analytics.]
   * @uses To Title Case [For transforming form IDs to title case for Google Analytics tracking.]
   */
  Forms: {
    submittingContent: 'Submitting ...',
    inFieldLabelsSettings: {
      'left': 5,
      'top': 2,
      'zIndex': 1
    },
    validatorSettings: {
      offset: [0, 0],
      position: 'bottom left'
    },
    bindValidation: function (bindForm, overlay) {

      /** Saves the form as a jQuery object. */
      var $bindForm = $(bindForm);

      /** Set up Google Analytics tracking variables. */
      var $gaqEvent;
      var $gaqEventVal;

      /** Assign tracking event name to data object of form. */
      if ($bindForm.find('input[name="gaq_event"]').length) {
        $bindForm.data('event', $bindForm.find('input[name="gaq_event"]').val());
        $gaqEvent =  $bindForm.data('event');
      }

      /** Assign tracking event value to data object of form. */
      if ($bindForm.find('input[name="gaq_event_val"]').length) {
        $bindForm.data('eventVal', $bindForm.find('input[name="gaq_event_val"]').val());
        $gaqEventVal = $bindForm.data('eventVal');
      }

      /** Establishes a different error class for forms loaded in overlays. */
      if (overlay === true) {
        var settings = {
          messageClass: 'error-overlay'
        };
        settings = $.extend(this.validatorSettings, settings);
        $bindForm.validator(settings);
      } else {
        $bindForm.validator(this.validatorSettings);
      }

      /** Triggers a reflow of error messages on successful validation of text fields. */
      $bindForm.data('validator').onSuccess(function () {
        this.reflow();
      });

      /** Triggers a reflow of error messages on select menu change. */
      $bindForm.find('select').change(function () {
        $bindForm.data('validator').reflow();
      });

      /** Handles AJAX submissions. */
      if ($bindForm.hasClass('ajax-form')) {
        $bindForm.ajaxForm({
          beforeSubmit: function () {
            /** Give user feedback that form is submitting, and disable submit button to prevent multiple submissions. */
            $bindForm.find('input[type="submit"]')
              .addClass('submitting')
              .val(CORE.Forms.submittingContent)
              .attr('disabled', 'disabled');

            /** Shows opt-in content if the subscribe box is checked. */
            if ($('.opted-in').length && $('input[name="subscribe"]:checked').length) {
              $('.ajax-confirm .opted-in').show();
            }
          },
          success: function (rtn) {
            /** Check if the form processed successfully. */
            if (rtn) {
              var $formID = $bindForm.attr('id');
              var formName = $formID.replace('-', ' ').toTitleCase();

              /** Hook function for custom Google Analytics code. */
              if (typeof (window.customGA) === "function") {
                window.customGA($formID);
              } else {
                if (typeof _gaq === 'object') {
                  _gaq.push(['_trackEvent', 'Forms', formName]);
                }
              }

              /** Hide the form. */
              $bindForm.slideUp();

              /** Display confirmation message. */
              $('.ajax-confirm').slideDown();
            }
          }
        });
      } else {
        $bindForm.submit(function (e) {
          if (this.checkValidity()) {
            var formID = $bindForm.attr('id');
            var formName = formID.replace('-', ' ').toTitleCase();

            /** Hook function for custom Google Analytics code, and fallback code. */
            if (typeof (window.customGA) === "function") {
              window.customGA(formID);
            } else {
              if (typeof _gaq === 'object') {
                _gaq.push(['_trackEvent', 'Forms', formName]);
              }
            }
          }
        });
      }

      /** Turns on inFieldLabels, if requested through class assignment. */
      this.enableInFieldLabels();

      /** Hook function for when the form is loaded. */
      if (typeof (formLoaded) === 'function') {
        formLoaded(bindForm);
      }
    },
    enableInFieldLabels: function () {
      if ($.isFunction($.fn.inFieldLabels)) {
        $('.infieldlabels label').not('.notinfield').inFieldLabels()
          .css('position', 'absolute')
          .css('left', CORE.Forms.inFieldLabelsSettings.left)
          .css('top', CORE.Forms.inFieldLabelsSettings.top)
          .css('z-index', CORE.Forms.inFieldLabelsSettings.zIndex)
          .parent().css('position', 'relative');
      }
    },
    init: function () {
      $('form').each(function () {
        CORE.Forms.bindValidation(this);
      });
    }
  },

  /**
   * Sets up listeners for overlays and dynamically loads overlay content using AJAX based on link URL.
   *
   * @property {string}   loadingContent Default setting for loading content. Can be overridden in script.js.
   * @property {string}   settings       Default settings for the overlay. Can be overridden in script.js.
   * @property {function} init           Creates the container DIV and binds the listeners.
   *
   * @type {Object}
   * @uses jQuery
   * @uses jQuery Tools [To set up and interact with the overlay, and for the mask.]
   * @see  Forms
   */
  Overlay: {
    loadingContent: 'Loading ...',
    settings: {
      closeOnClick: true,
      fixed: true,
      mask: {
        color: '#333',
        loadSpeed: 200,
        opacity: 0.6
      },
      onBeforeLoad: function () {
        var $content = this.getOverlay().find('.overlay-content');
        var url = this.getTrigger().attr('href');
        var extension = url.substr((url.lastIndexOf('.') + 1));
        if (extension === 'jpg'
            || extension === 'png'
            || extension === 'gif'
            || extension === 'jpeg') {
          $content.html('<img src="' + url + '" alt="">');
        } else {
          var queryString = url.split('?');
          if (queryString.length > 1) {
            if (queryString[0].substr(-1) !== '/') {
              queryString[0] += '/';
            }
            url = queryString[0] + 'ajax/?' + queryString[1];
          } else {
            if (url.substr(-1) !== '/') {
              url += '/';
            }
            url += 'ajax/';
          }
          $content.load(url, function () {
            $(this).find('form').each(function () {
              CORE.Forms.bindValidation(this, true);
            });
          });
        }
      },
      onLoad: function () {
        var left = Math.max(($(window).width() - $('#overlay').outerWidth()) / 2, 0);
        $('#overlay').animate({'left': left + 'px'});
      },
      onClose: function () {
        this.getOverlay().find('.overlay-content').find('form').each(function () {
          $(this).data('validator').destroy();
        });
        this.getOverlay().find('.overlay-content').empty().html(this.loadingContent);
        this.getOverlay().css('left', '0px');
      }
    },
    init: function () {
      if (!$('html').hasClass('lt-ie7') && $('.overlay').length) {
        var $overlayTriggers = $('a.overlay, .overlay a');
        $('body').append('<div id="overlay" style="display: none"><div class="overlay-content">' + this.loadingContent + '</div></div>');
        $overlayTriggers.attr('rel', '#overlay');
        $overlayTriggers.overlay(this.settings);
      }
    }
  },

  /**
   * Handles global show/hide functionality.
   *
   * @property {function} init Initializes the ShowHide functionality.
   *
   * @type {Object}
   * @uses jQuery
   */
  ShowHide: {
    init: function () {
      $('.show-hide a[href^=#]').click(function () {
        $('.show-hide').hide();
        $($(this).attr('href')).show();
        return false;
      });
    }
  },

  /**
   * Handles global tooltip functionality.
   *
   * @property {object}   settings The settings object passed to the ToolTips function.
   * @property {function} init     Initializes the ToolTips functionality.
   *
   * @type {Object}
   * @uses jQuery
   * @uses jQuery Tools
   */
  ToolTip: {
    loadingContent: 'Loading ...',
    settings: {
      cancelDefault: true,
      delay: 30,
      effect: 'toggle',
      offset: [0, 0],
      opacity: '1',
      position: 'top right',
      predelay: 0,
      relative: false,
      tipClass: 'tooltip-content',
      onBeforeShow: function () {
        var $tip = this.getTip();
        var $trigger = this.getTrigger();
        var initialHeight = $tip.height();
        if ($trigger.data('title') === CORE.ToolTip.loadingContent) {
          var url = this.getTrigger().attr('href');
          if (url.substr(-1) !== '/') {
            url += '/';
          }
          url += 'ajax/';
          $tip.load(url, function () {
            $trigger.data('title', 'Loaded');
            var oldTop = parseInt($tip.css('top'), 10);
            if (CORE.ToolTip.settings.position.substr(0, 3) === 'top') {
              $tip.css('top', oldTop + initialHeight - $tip.height());
            }
          });
        }
      }
    },
    init: function () {
      if ($('.tooltip').length) {
        $('.tooltip').each(function () {
          var $this = $(this);
          $this.attr('title', CORE.ToolTip.loadingContent);
          $this.data('title', CORE.ToolTip.loadingContent);
        }).on('click', function () {
          return false;
        });
        $('.tooltip').tooltip(this.settings).dynamic();
      }
    }
  },

  /**
   * Handles zoom functionality on thumbnail images.
   *
   * @property {object}   settings The settings object passed to the jqZoom function.
   * @property {function} init     Initializes the zoom functionality.
   *
   * @type {Object}
   * @uses jQuery
   * @uses jqZoom [For binding zoom functionality to objects.]
   */
  Zoom: {
    settings: {
      lens: true,
      position: 'right',
      preloadImages: false,
      title: false,
      xOffset: 20,
      zoomHeight: 400,
      zoomType: 'reverse',
      zoomWidth: 350
    },
    init: function () {
      if ($('.zoom').length) {
        $('.zoom').jqzoom(this.settings);
      }
    }
  }
};
