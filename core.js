/*global $, navigator, _gaq, formLoaded, window*/

/**
 * Core object. Contains regularly used scripts for rapid deployment & easy updates.
 *
 * @version 1.0.0
 *
 * @property {function} init     A function to initialize all of the CORE functions.
 * @property {object}   browser  A collection of boolean values about the browser.
 * @property {object}   device   A collection of boolean values about the device.
 * @property {function} balance  A function to balance the height of two elements.
 * @property {object}   Forms    An object to manage forms.
 * @property {object}   Overlay  An object to manage overlays.
 *
 * @author Adam Leder    <aleder@fingerpaintmarketing.com>
 * @author Beau Watson   <bwatson@fingerpaintmarketing.com>
 * @author Chris O'Brien <cobrien@fingerpaintmarketing.com>
 * @author Kevin Fodness <kfodness@fingerpaintmarketing.com>

 * @uses Google Analytics
 * @uses jQuery 1 (http://jquery.com/)
 * @uses jQuery UI (http://jqueryui.com/)
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
    this.Forms.init();
    this.Overlay.init();
    this.Rotator.init();
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
    useContactFormSeven: false,
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
      if (this.useContactFormSeven) {
        this.contactFormSevenSupport();
      }
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
              console.log($formID);
              if($formID != '' && $formID != undefined) {
                var formName = $formID.replace('-', ' ').toTitleCase();
              } else if ($('#form-name').val() != '') {
                var formName = $('#form-name').val().replace('-', ' ').toTitleCase();
              } else  {
                var formName = 'Form Submission';
              }


              /** Hook function for custom Google Analytics code. */
              if (typeof (window.customGA) === "function") {
                window.customGA($formID);
              } else {
                if (typeof _gaq === 'object') {
                  _gaq.push(['_trackEvent', 'Forms', formName]);
                }
              }

              if (typeof (window.reAjax) === "function") {
                window.reAjax($formID);
              }

              if (!$bindForm.hasClass('re-ajax')) {
                /** Hide the form. */
                $bindForm.slideUp();
              }

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
    }, contactFormSevenSupport: function() {
      if($('.wpcf7-validates-as-required').attr('required') != 'required') {
        $('.wpcf7-validates-as-required').attr('required','required');
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
  *
  * Takes a string in format "param1=value1&param2=value2" and returns an object { param1: 'value1', param2: 'value2' }. If the "param1" ends with "[]" the param is treated as an array.
  *
  * Example:
  *
  * Input:  param1=value1&param2=value2
  * Return: { param1 : value1, param2: value2 }
  *
  * Input:  param1[]=value1&param1[]=value2
  * Return: { param1: [ value1, value2 ] }
  *
  * @todo Support params like "param1[name]=value1" (should return { param1: { name: value1 } })
  */
  getParams: function(){
    if (typeof (CORE.params) !== "object") {
      var serializedString = window.location.href.slice(window.location.href.indexOf('?') + 1);
      var str = decodeURI(serializedString);
      var pairs = str.split('&');
      var obj = {}, p, idx, val;
      for (var i=0, n=pairs.length; i < n; i++) {
        p = pairs[i].split('=');
        idx = p[0];

        if (idx.indexOf("[]") == (idx.length - 2)) {
          // Eh um vetor
          var ind = idx.substring(0, idx.length-2)
          if (obj[ind] === undefined) {
            obj[ind] = [];
          }
          obj[ind].push(p[1]);
        }
        else {
          obj[idx] = p[1];
        }
      }
      CORE.params = obj;
      return obj;
    } else {
      return CORE.params;
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
        if (url.slice(-3) === 'jpg'
            || url.slice(-3) === 'png'
            || url.slice(-3) === 'gif'
            || url.slice(-4) === 'jpeg') {
          $content.html('<img src="' + url + '" alt="">');
        } else {
          var query_string = url.split('?');

          if (query_string.length > 1) {
            if (query_string[0].slice(-1) !== '/') {
              query_string[0] += '/';
            }

            url = query_string[0] + 'ajax/?' + query_string[1];
          } else {
            if (url.slice(-1) !== '/') {
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
      onClose: function () {
        this.getOverlay().find('.overlay-content').find('form').each(function () {
          $(this).data('validator').destroy();
        });
        //Code below is to get a wistia ID...might be useful?
        // var wid = $('.wistia_embed').attr('id');
        // wid = wid.replace('wistia_', '');
        // console.log('WID'+wid);
        if ($('.wistia_embed').length) {
          window.removeThisVideo();
        }

        this.getOverlay().find('.overlay-content').empty().html(this.loadingContent);
        this.getOverlay().css('left', '0px');
      }
    },
    init: function () {
      if (!$('html').hasClass('lt-ie7') && $('.overlay').length) {
        var $overlayTriggers = $('a.overlay, .overlay a');
        var params = CORE.getParams();
        $('body').append('<div id="overlay"><div class="overlay-content">' + this.loadingContent + '</div></div>');
        $overlayTriggers.attr('rel', '#overlay');
        $overlayTriggers.overlay(this.settings);
        if (params.core_action == 'overlay') {
          this.processAction(params.core_action_href);
        }

      }
    },
    processAction: function(target_href) {
      var match = null;
      $('.overlay').each(function() {
        match = $(this).attr('href').match(target_href);

        if (match !== null) {
          $(this).click();
        }

        return (this != null);
      });
    }
  },

  /**
   * Handles banner rotation functionality.
   *
   * @property {object}   settings      The settings object passed to the ToolTips function.
   * @property {function} init          Initializes the Rotator, its navigation, and click/hover events.
   * @property {function} advanceSlide  Logic to control advancing to a particular slide.
   *
   * @type {Object}
   * @uses jQuery
   * @uses jQuery Tools
   */
  Rotator: {
    activeClass: '.active-pip',
    slideClass: '.rotate-slide',
    slidesContainer: $('.rotator'),
    slideNavContainer: $('#rotate-nav'),
    slideNavLinks: $('#rotate-nav a'),
    settings: {
        autoplay: true,
        autopause: true,
        effect: 'horizontal',
        interval: 5000,
        showNav: true,
        showPrevNext: false
    },
    init: function () {
      if ( $('.rotator').length ) {

        if( this.settings.showNav){
          this.prepareNavLinks();
        }

        if( this.settings.showPrevNext) {
          this.prepareNextPrevLinks();
        }


        if(this.settings.autoplay) {
          // Timer - Passes the current slide nav link w/ class of active
          window.slideTimer = setInterval(function(){CORE.Rotator.advanceSlide($(CORE.Rotator.activeClass).index());},CORE.Rotator.settings.interval);
        }

        if(this.settings.autopause) {
          $('.rotator').on({
            mouseover: function(){
              clearInterval(slideTimer);
            },
            mouseout: function(){
              if(CORE.Rotator.settings.autoplay) {
                // Ensure all timers are cleared out
                clearInterval(slideTimer);
                // Reset the timer
                slideTimer = setInterval(function(){CORE.Rotator.advanceSlide($(CORE.Rotator.activeClass).index());},CORE.Rotator.settings.interval);
              }
            }
          });
        }
      }
    },
    advanceSlide: function(currentSlide) {
      // Set the position of the next slide
      var nextSlide = currentSlide + 1;

      // Set next slide to first slide
      if ( nextSlide == $(CORE.Rotator.slideNavContainer).children().length ){
        nextSlide = 0;
      }

      // Remove active class from all slide nav links
      // Add active class to clicked link
      $(CORE.Rotator.slideNavContainer).children().removeClass('active-pip')
              .eq(nextSlide).addClass('active-pip');

      // Animate the position of the .rotator container
      $(CORE.Rotator.slidesContainer).animate({
        left: -($(CORE.Rotator.slideClass).width() * nextSlide)
      });

      if (typeof (window.slideCallback) === "function") {
        window.slideCallback(nextSlide);
      }
    },
    prepareNavLinks: function () {
      // Contruct the slideshow navigation
        $(CORE.Rotator.slidesContainer).children(CORE.Rotator.slideClass).each(function(){
          var $this = $(this);
          // Nav link to be added
          var $navLink = $('<a href="#" class="pip"/>');

          // Determine if it's the first link
          // add Active class
          if ( $this.index() == 0 ){
            $navLink.addClass('active-pip');
          }

          // Add link to navigation
          $(CORE.Rotator.slideNavContainer).append($navLink);

        });

        $(CORE.Rotator.slideNavContainer).on('click','a',function(){
          var $this = $(this);
          // Store the position of the clicked
          // nav link within the link list
          var $linkPos = $this.index();
          var $currentActive = $linkPos--;

          // Check if the previous slide is the last on in list
          if ( $linkPos < 0 ) {
            $linkPos = $(CORE.Rotator.slideNavLinks).length - 1;
          }

          // Call the advance slide function
          // Pass current active slide position
          CORE.Rotator.advanceSlide($linkPos);

          // Reset timer
          if(CORE.Rotator.settings.autoplay) {
            clearInterval(window.slideTimer);
            window.slideTimer = setInterval(function(){CORE.Rotator.advanceSlide($(CORE.Rotator.activeClass).index());},CORE.Rotator.settings.interval);
          }

          return false;
        });
    },
    prepareNextPrevLinks: function () {
      // Add on click event listener
      $('#rotate-next').on('click',function(){
        // Store the position of the clicked
        var $linkPos = $(CORE.Rotator.activeClass).index();

        // Check if the previous slide is the last on in list
        if ( $linkPos < 0 ) {
          $linkPos = $(CORE.Rotator.slideNavLinks).length - 1;
        }

        // Call the advance slide function
        // Pass current active slide position
        CORE.Rotator.advanceSlide($linkPos);

        // Reset timer
        if(CORE.Rotator.settings.autoplay) {
          clearInterval(slideTimer);
          slideTimer = setInterval(function(){CORE.Rotator.advanceSlide($(CORE.Rotator.activeClass).index());},CORE.Rotator.settings.interval);
        }

        return false;
      });

      $('#rotate-prev').on('click',function(){
        // Store the position of the clicked
        var $linkPos = $(CORE.Rotator.activeClass).index();

                 // Check if the previous slide is the last on in list
        if ( $linkPos < 1 ) {
          $linkPos = $(CORE.Rotator.slideNavContainer).children().length - 2;
        } else {
          $linkPos = $(CORE.Rotator.activeClass).index() - 2;
        }

        // Call the advance slide function
        // Pass current active slide position
        CORE.Rotator.advanceSlide($linkPos);

        // Reset timer
        if(CORE.Rotator.settings.autoplay) {
          clearInterval(slideTimer);
          slideTimer = setInterval(function(){CORE.Rotator.advanceSlide($(CORE.Rotator.activeClass).index());},CORE.Rotator.settings.interval);
        }

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
          var query_string = url.split('?');

          if (query_string.length > 1) {

            if (query_string[0].substr(-1) !== '/') {
              query_string[0] += '/';
            }

            url = query_string[0] + 'ajax/?' + query_string[1];
          } else {
            if (url.substr(-1) !== '/') {
              url += '/';
            }
            url += 'ajax/';
          }
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
        var params = CORE.getParams();
        $('.tooltip').each(function () {
          var $this = $(this);
          $this.attr('title', CORE.ToolTip.loadingContent);
          $this.data('title', CORE.ToolTip.loadingContent);
        }).on('click', function () {
          return false;
        });
        $('.tooltip').tooltip(this.settings).dynamic();
        if (params.core_action == 'tooltip') {
          this.processAction(params.core_action_href);
        }
      }
    },
    processAction: function(target_href) {
      var match = null;
      $('.tooltip').each(function() {
        match = $(this).attr('href').match(target_href);

        if (match !== null) {
          $(this).mouseover();
        }

        return (this != null);
      });
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
