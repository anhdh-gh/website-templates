'use strict';

window.theme = window.theme || {};

theme.Global = function() {

    function Global() {
        this.settings = {
            set_offset_with_fixed_body: [
                '.header__content--sticky',
                '.footbar',
                '.footer--fixed',
                '#admin_bar_iframe',
                '#preview-bar-iframe'
            ]
        };

        this.dom = {};

        this.load();
    };

    Global.prototype = $.extend({}, Global.prototype, {
        load: function() {
            var ua = window.navigator.userAgent.toLowerCase(),
                current_bp,
                $scroll_example = $('.scroll-offset-example');

            window.ie = (/trident/gi).test(ua) || (/msie/gi).test(ua);
            window.edge = document.documentMode || /edge/.test(ua);
            window.ios = navigator.userAgent.match(/like Mac OS X/i);
            window.moz = typeof InstallTrigger !== 'undefined';
            window.$window = $(window);
            window.$document = $(document);
            window.$html = $('html');
            window.$body = $html.find('body');

            if(ios) {
                $html.addClass('is-ios');
            } else if(edge) {
                $html.addClass('is-edge');
            } else if(ie) {
                $html.addClass('is-ie');
            } else if(moz) {
                $html.addClass('is-moz');
            }

            this.dom.$icons = $('#theme-icons');

            theme.rtl = $html.attr('dir') === 'rtl' ? true : false;

            theme.breakpoints = {
                values: {
                    xs: 0,
                    sm: 541,
                    md: 778,
                    lg: 1025,
                    xl: 1260
                }
            };
            theme.breakpoints.main = theme.breakpoints.values.lg;
            theme.current = {};

            function checkWindow() {
                theme.current.width = window.innerWidth;
                theme.current.height = window.innerHeight;
            };

            function checkBreakpoint() {
                theme.current.is_mobile = theme.current.width < theme.breakpoints.main;
                theme.current.is_desktop = !theme.current.is_mobile;

                $.each(theme.breakpoints.values, function(k, v) {
                    if(v > theme.current.width) {
                        return false;
                    }

                    theme.current.bp = k;
                });

                if(current_bp && current_bp != theme.current.bp) {
                    $(window).trigger('theme.changed.breakpoint');
                }

                current_bp = theme.current.bp;
            };

            function scrollPaddingStyle() {
                var $style = $('style.scroll-offset-style');

                theme.current.scroll_w = $scroll_example[0].offsetWidth - $scroll_example[0].clientWidth;

                if(theme.current.scroll_w > 0) {
                    if(!$style.length) {
                        var offset_scroll_style_html = 'body.overflow-hidden.offset-scroll{padding-right:' + theme.current.scroll_w + 'px;}.fixed-elem.offset-scroll{padding-right:' + theme.current.scroll_w + 'px;}';

                        $('head').append($('<style>').addClass('scroll-offset-style').html(offset_scroll_style_html));
                    }
                } else {
                    $style.remove();
                }
            };

            $(window).on('resize', $.debounce(250, function() {
                checkWindow();
                checkBreakpoint();

                $(window).trigger('theme.resize');
            }));

            $(window).on('theme.changed.breakpoint', function() {
                scrollPaddingStyle();
            });

            checkWindow();
            checkBreakpoint();
            scrollPaddingStyle();

            $(window).on('load', function () {
                theme.is_loaded = true;
            });
        },
        bodyHasScroll: function(prop) {
            var d = document,
                e = d.documentElement,
                b = d.body,
                client = "client" + prop,
                scroll = "scroll" + prop;

            return /CSS/.test(d.compatMode) ? (e[client] < e[scroll]) : (b[client] < b[scroll]);
        },
        fixBody: function() {
            if (this.bodyHasScroll('Height')) {
                $body.addClass('offset-scroll');

                $.each(this.settings.set_offset_with_fixed_body, function() {
                    $(this).addClass('offset-scroll fixed-elem');
                });
            }

            this._fixed_scroll_top = pageYOffset;

            $body.css({ top: pageYOffset * -1 });
            $body.addClass('overflow-hidden position-fixed left-0 w-100');

            if(theme.StickySidebar) {
                theme.StickySidebar.update($('.js-sticky-sidebar'));
            }
        },
        unfixBody: function() {
            $body.removeClass('offset-scroll overflow-hidden position-fixed left-0 w-100');

            $body.add($html).scrollTop(this._fixed_scroll_top);
            this._fixed_scroll_top = null;

            $body.css({ top: '' });

            $.each(this.settings.set_offset_with_fixed_body, function() {
                $(this).removeClass('fixed-elem offset-scroll');
            });

            if(theme.StickySidebar) {
                theme.StickySidebar.update($('.js-sticky-sidebar'));
            }
        },
        responsiveHandler: function(obj) {
            var namespace = obj.namespace ? obj.namespace : '.widthHandler',
                current_bp;
            
            function bind() {
                $.each(obj.events, function(event, func) {
                    if(obj.delegate) {
                        $(obj.element).on(event + namespace, obj.delegate, func);
                    } else {
                        $(obj.element).on(event + namespace, func);
                    }
                });
            };

            function unbind() {
                $.each(obj.events, function(event) {
                    $(obj.element).unbind(event + namespace);
                });
            };

            function on_resize() {
                if(theme.current.is_mobile !== current_bp) {
                    current_bp = theme.current.is_mobile;

                    if((obj.on_desktop && theme.current.is_desktop) || (obj.on_mobile && theme.current.is_mobile)) {
                        bind();
                    } else {
                        unbind();
                    }
                }
            };

            $(window).on('theme.resize' + namespace, function() {
                on_resize();
            });

            on_resize();

            return {
                unbind: function() {
                    $(window).unbind('theme.resize' + namespace);
                    unbind();
                }
            }
        },
        getIcon: function(numb, html) {
            var $icon = this.dom.$icons.find('.icon-theme-' + numb);
            
            return html ? $icon.parent().html() : $icon.clone();
        },
        handleize: function (str) {
            return str.toLowerCase().replace(/[-!"#$₹%&'* ,./:;<=>?@[\\\]_`{|}~]+/g, "-").replace(/[()]+/g, "").replace(/^-+|-+$/g, "");
        }
    });

    theme.Global = new Global;
};
theme.ImagesLazyLoad = function() {

    function ImagesLazyLoad() {
        this.load();
    };

    ImagesLazyLoad.prototype = $.extend({}, ImagesLazyLoad.prototype, {
        load: function() {
            this.init();

            this.page_is_loaded = true;
        },
        init: function () {
            var _ = this;

            this.api = new LazyLoad({
                elements_selector: '.lazyload',
                threshold: 100,
                callback_enter: function(elem) {
                    var $elem = $(elem),
                        url;

                    if($elem.attr('data-bg')) {
                        url = $elem.attr('data-master') || $elem.attr('data-bg');

                        $elem.css({
                            'background-image': _.buildSrcset($elem, url, 'bg')
                        });
                    } else {
                        url = $elem.attr('data-master') || $elem.attr('data-srcset');

                        $elem.attr('data-srcset', _.buildSrcset($elem, url, 'srcset'));
                    }
                },
                callback_load: function (elem) {
                    $(elem).trigger('lazyloaded');
                }
            });

            function checkImages() {
                $('.lazyload.loaded').each(function() {
                    var $this = $(this),
                        url = $this.attr('data-master');

                    if(!url) {
                        return;
                    }

                    if($this.attr('data-bg')) {
                        $this.css({
                            'background-image': _.buildSrcset($this, url, 'bg')
                        });
                    } else {
                        $this.attr('srcset', _.buildSrcset($this, url, 'srcset'));
                    }
                });
            };

            $window.on('load', function() {
                $window.on('theme.resize.lazyload checkImages', checkImages);
            });
        },
        update: function () {
            if(this.page_is_loaded) {
                this.api.update();
            }
        },
        buildSrcset: function($elem, url, type) {
            var scale = +$elem.attr('data-scale') || 1,
                $parent,
                aspect_ratio,
                width,
                height,
                scale_perspective;

            if(type === 'bg') {
                width = $elem.width();
                width *= scale;

                width = Math.ceil(width);

                return width > 0 ? url.replace('[width]', width) : $elem.attr('data-bg');
            } else {
                $parent = $elem.parent();
                width = $parent.width();
                height = $parent.innerHeight();
                aspect_ratio = $elem.attr('data-aspect-ratio');
                scale_perspective = +$elem.attr('data-scale-perspective') || 1;
                width *= scale;
                height *= scale;

                if(theme.current.is_desktop) {
                    width *= scale_perspective;
                    height *= scale_perspective;
                }

                width = Math.ceil(Math.max(width, height * aspect_ratio));

                return width > 0 && url.indexOf('{width}') !== -1 ? url.replace('{width}', width) + ' 1x, ' + url.replace('{width}', width * 2) + ' 2x' : $elem.attr('data-srcset');
            }
        }
    });

    theme.ImagesLazyLoad = new ImagesLazyLoad;
};
theme.Position = function() {

    function Position() {
        this.settings = {
            name: 'data-js-position-name',
            desktop: 'data-js-position-desktop',
            mobile: 'data-js-position-mobile',
            all: 'data-js-position-all'
        };

        this.selectors = {
            elements: '.js-position'
        };

        this.load();
    };

    Position.prototype = $.extend({}, Position.prototype, {
        load: function() {
            var _ = this,
                current_position_is_desktop;

            function check_position() {
                if(current_position_is_desktop !== theme.current.is_desktop) {
                    _.update();

                    current_position_is_desktop = theme.current.is_desktop;
                }
            };

            $(window).on('theme.resize.position', function() {
                check_position();
            });
            
            check_position();

            var $elements_append_onload = $(this.selectors.elements).filter('[data-js-position-onload]');

            this.append($elements_append_onload, this.settings.all);
        },
        update: function(name) {
            var $elements = name ? $('[' + this.settings.name + '="' + name + '"]') : $(this.selectors.elements).not('[data-js-position-onload]'),
                append_to = theme.current.is_desktop ? this.settings.desktop : this.settings.mobile;

            this.append($elements, append_to);
        },
        append: function($elements, append_to) {
            var _ = this;

            $elements.each(function() {
                var $this = $(this),
                    append_to_name = $this.attr(_.settings.name);

                var $append_to = $('[' + append_to + '="' + append_to_name + '"]');

                if($append_to.length && !$.contains($append_to[0], $this[0])) {
                    if($append_to.find('[' + _.settings.name + '="' + append_to_name + '"]').length) {
                        $this.remove();
                    } else {
                        $this.appendTo($append_to);
                    }
                }
            });
        }
    });

    theme.Position = new Position;
};
theme.Dropdown = function() {

    var settings = {
        namespace: '.dropdown'
    };

    function Dropdown() {
        this.selectors = {
            element: '.js-dropdown',
            button: '[data-js-dropdown-button]',
            dropdown: '[data-js-dropdown]'
        };

        this.load();
    };

    Dropdown.prototype = $.extend({}, Dropdown.prototype, {
        duration: function () {
            return theme.animations.dropdown.duration * 1000;
        },
        load: function() {
            var _ = this;

            theme.Global.responsiveHandler({
                namespace: settings.namespace,
                element: $body,
                delegate: this.selectors.button + ', ' + this.selectors.dropdown,
                on_desktop: true,
                events: {
                    'show hide close': function(e) {
                        var $elem = $(this).parents(_.selectors.element),
                            $btn = $elem.find(_.selectors.button),
                            $dropdown = $elem.find(_.selectors.dropdown);

                        _['_' + e.type]($elem, $dropdown, $btn);
                    }
                }
            });

            theme.Global.responsiveHandler({
                namespace: settings.namespace,
                element: $body,
                delegate: this.selectors.button,
                on_desktop: true,
                events: {
                    'mouseenter': function() {
                        var $this = $(this),
                            $elem = $this.parents(_.selectors.element),
                            $dropdown = $elem.find(_.selectors.dropdown);

                        if(!$this.hasClass('active') && !$dropdown.hasClass('show')) {
                            _._show($elem, $dropdown, $this);
                        }
                    },
                    'mousedown': function(e) {
                        var $this = $(this),
                            $elem = $this.parents(_.selectors.element),
                            $dropdown = $elem.find(_.selectors.dropdown);

                        if(!$this.hasClass('active')) {
                            _._show($elem, $dropdown, $this, true);

                            $body.one('mousedown' + settings.namespace, function (e) {
                                if(!$(e.target).parents(_.selectors.dropdown + ', ' + _.selectors.button).length) {
                                    $(_.selectors.dropdown).trigger('hide');
                                }
                            });
                        } else {
                            _._hide($elem, $dropdown, $this);
                        }

                        e.preventDefault();
                        return false;
                    }
                }
            });

            theme.Global.responsiveHandler({
                namespace: settings.namespace,
                element: $body,
                delegate: this.selectors.element,
                on_desktop: true,
                events: {
                    'mouseleave': function() {
                        var $this = $(this),
                            $btn = $this.find(_.selectors.button),
                            $dropdown = $this.find(_.selectors.dropdown);

                        if(!$btn.hasClass('active')) {
                            _._hide($this, $dropdown, $btn);
                        }
                    }
                }
            });
        },
        _show: function ($elem, $dropdown, $btn, is_click) {
            $(this.selectors.dropdown).not($dropdown).trigger('close');

            if(is_click) {
                $btn.addClass('active');
            }

            if($dropdown.hasClass('show')) {
                return;
            }

            $(this.selectors.element).removeClass('hovered');
            $elem.addClass('hovered');

            $dropdown.addClass('show animate');

            if(window.edge) {
                $dropdown.addClass('visible');
            } else {
                $dropdown.velocity('stop', true).removeAttr('style');

                $dropdown.velocity('slideDown', {
                    duration: this.duration(),
                    begin: function () {
                        setTimeout(function () {
                            $dropdown.addClass('visible');
                        }, 0);
                    },
                    complete: function () {
                        $dropdown.removeAttr('style');
                    }
                });
            }
        },
        _hide: function ($elem, $dropdown, $btn) {
            if(window.edge) {
                $dropdown.removeClass('show animate visible');
                $elem.removeClass('hovered');
            } else {
                $dropdown.velocity('stop', true);

                $dropdown.velocity('slideUp', {
                    duration: this.duration(),
                    begin: function () {
                        $dropdown.removeClass('visible');
                    },
                    complete: function () {
                        $dropdown.removeClass('show animate').removeAttr('style');
                        $elem.removeClass('hovered');
                    }
                });
            }

            $btn.removeClass('active');
            $body.unbind('click' + settings.namespace);
        },
        _close: function ($dropdown, $btn) {
            $dropdown.velocity('stop');
            $dropdown.removeClass('show animate visible').removeAttr('style');
            $btn.removeClass('active');
            $body.unbind('click' + settings.namespace);
        }
    });

    theme.Dropdown = new Dropdown;
};
theme.Select = function() {
    
    var settings = {
        namespace: '.select'
    };

    function Select() {
        this.selectors = {
            element: '.js-select',
            dropdown: '[data-js-select-dropdown]'
        };

        this.load();
    };

    Select.prototype = $.extend({}, Select.prototype, {
        load: function() {
            var _ = this;

            theme.Global.responsiveHandler({
                namespace: settings.namespace,
                element: $body,
                delegate: this.selectors.element + ' ' + this.selectors.dropdown + ' span',
                on_desktop: true,
                events: {
                    'click': function() {
                        var $this = $(this);
                        
                        if(!$this.hasClass('selected') && !$this[0].hasAttribute('disabled')) {
                            var value = $this.attr('data-value'),
                                $dropdown = $this.parents(_.selectors.dropdown),
                                $wrapper = $this.parents('.js-select'),
                                $select = $wrapper.find('select');

                            $select.val(value);

                            $dropdown.find('span').removeClass('selected');
                            $this.addClass('selected');

                            $dropdown.trigger('hide');
                            
                            $select.change();
                        }
                    }
                }
            });

            $body.on('change update' + settings.namespace, this.selectors.element + ' select', function() {
                var $this = $(this),
                    $dropdown_items = $this.parents(_.selectors.element).find(_.selectors.dropdown + ' span'),
                    value = $this.val();

                $dropdown_items.each(function() {
                    var $this = $(this);

                    $this[$this.attr('data-value') == value ? 'addClass' : 'removeClass']('selected');
                });
            });

            $(this.selectors.element + '[data-onload-check] select').trigger('update' + settings.namespace);
        }
    });

    theme.Select = new Select;
};
theme.Loader = function() {

    function Loader() {
        var _ = this;

        this.$loader = $('#theme-loader .js-loader');

        _.load();
    };

    Loader.prototype = $.extend({}, Loader.prototype, {
        load: function () {
            var $loader = $body.find('.js-loader[data-js-page-loader]');

            if(!$loader.hasClass('visible')) {
                $loader.remove();

                return;
            }

            $loader.on('transitionend', function () {
                $loader.remove();
            }).addClass('animate').removeClass('visible');

            if($loader.css('transition-duration') === '0s') {
                $loader.trigger('transitionend');
            }
        },
        set: function($elem, obj) {
            if($elem.length && !$elem.find('> .js-loader').length) {
                var $clone = this.$loader.clone(),
                    $spinner = $clone.find('[data-js-loader-spinner]'),
                    fixed_offset_l;

                if(obj) {
                    if(obj.bg === false) {
                        $clone.find('[data-js-loader-bg]').remove();
                    }
                    if(obj.spinner === false) {
                        $spinner.remove();
                    }
                    if(obj.fixed === true) {
                        $spinner.addClass('fixed');

                        fixed_offset_l = ($elem.innerWidth() / 2 + $elem[0].getBoundingClientRect().left) * 100 / theme.current.width;

                        $spinner.css({
                            left: fixed_offset_l + '%'
                        });
                    }
                    if(obj.delay) {
                        $clone.addClass('delay');
                    }
                }

                $elem.addClass('loading-element');

                $elem.append($clone);

                $clone.addClass('animate');

                setTimeout(function () {
                    $spinner.addClass('animate');
                    $clone.addClass('visible');
                }, 0);
            }
        },
        unset: function ($elem) {
            $elem.find('> .loader').remove();
            $elem.removeClass('loading-element');
        }
    });

    theme.Loader = new Loader;
};
theme.Popups = function() {

    function Popups() {
        this.selectors = {
            popup: '.js-popup',
            button: '.js-popup-button',
            button_close: '[data-js-popup-close]',
            bg: '[data-js-popup-bg]'
        };

        this.load();
    };

    Popups.prototype = $.extend({}, Popups.prototype, {
        load: function() {
            if($(this.selectors.popup).length) {
                var _ = this;

                $body.on('click', this.selectors.button, function(e) {
                    var $this = $(this),
                        name = $this.attr('data-js-popup-button');

                    if(_.callByName(name, $this)) {
                        e.preventDefault();
                        return false;
                    }
                });

                $body.on('click', this.selectors.button_close, function(e) {
                    var $this = $(this),
                        name = $this.parents('[data-js-popup-name]').attr('data-js-popup-name');

                    _.closeByName(name, $this);

                    e.preventDefault();
                    return false;
                });

                $body.on('click', this.selectors.popup + ' [data-js-popup-name]', function(e) {
                    var $t = $(e.target);

                    if($t[0].hasAttribute('data-js-popup-name')) {
                        var name = $t.attr('data-js-popup-name');

                        _.closeByName(name, $t);
                    }
                });

                setTimeout(function() {
                    $body.find(_.selectors.popup + ' [data-js-auto-call="true"]').each(function() {
                        _.callByName($(this).attr('data-js-popup-name'));
                    });
                }, 0);
            }
        },
        getByName: function(name) {
            var $popup = $(this.selectors.popup),
                $content = $popup.find('[data-js-popup-name="' + name + '"]');

            return $content;
        },
        callByName: function(name, $target) {
            var _ = this,
                $popup = $(this.selectors.popup),
                $bg = $(this.selectors.bg),
                $content = $popup.find('[data-js-popup-name="' + name + '"]'),
                is_ajax = $content.attr('data-js-popup-ajax') !== undefined ? true : false;

            function onCall() {
                $popup.scrollTop(0);

                $bg.one('transitionend', function () {
                    $content.add($bg).removeClass('animate');

                    $content.trigger('call.after', [$content, $target ? $target : null]);
                });

                $content.add($bg).addClass('animate');

                setTimeout(function () {
                    $content.add($bg).addClass('visible');

                    if($bg.css('transition-duration') === '0s') {
                        $bg.trigger('transitionend');
                    }
                }, 0);

                if($content[0].hasAttribute('data-js-popup-mobile-only')) {
                    $window.on('theme.changed.breakpoint.popups', function() {
                        if(!theme.current.is_mobile) {
                            _.closeByName(name);
                        }
                    });
                }
            };

            if($content.length) {
                if(theme.current.is_desktop && $content[0].hasAttribute('data-js-popup-mobile-only')) {
                    return false;
                }

                $bg.unbind('transitionend');

                $content.trigger('call.before', [$content, $target ? $target : null]);

                $popup.addClass('active');

                $popup.find('[data-js-popup-name]').removeClass('show visible');
                $popup.add($content).addClass('show');

                theme.Global.fixBody();

                if(is_ajax) {
                    $content.addClass('is-process-loading');

                    theme.Loader.set($popup, {
                        fixed: true,
                        delay: true
                    });

                    $content.on('contentloaded', function () {
                        $content.removeClass('is-process-loading');

                        onCall();

                        theme.Loader.unset($popup);
                    });
                } else {
                    onCall();
                }

                $body.on('keyup.popups', function(e) {
                    if(e.keyCode === 27) {
                        _.closeAll();
                    }
                });

                $content.trigger('call.visible', [$content, $target ? $target : null]);

                return true;
            } else {
                return false;
            }
        },
        closeByName: function(name, $target) {
            var $popup = $(this.selectors.popup),
                $bg = $(this.selectors.bg),
                $content = $popup.find('[data-js-popup-name="' + name + '"]'),
                duration = $bg.css('transition-duration');

            if($content.length) {
                $content.unbind('contentloaded').removeClass('is-process-loading');
                $bg.unbind('transitionend');
                $body.unbind('keyup.popups');
                $window.unbind('theme.changed.breakpoint.popups');

                $content.trigger('close.before', [$content, $target ? $target : null]);

                theme.Loader.unset($popup);

                $bg.one('transitionend', function () {
                    $popup.add($content).removeClass('show');
                    $content.add($bg).removeClass('animate');

                    theme.Global.unfixBody();

                    $popup.removeClass('active');

                    $content.trigger('close.after', [$content, $target ? $target : null]);
                });

                $content.add($bg).addClass('animate');

                if(!$bg.hasClass('visible') || $bg.css('transition-duration') === '0s') {
                    $bg.trigger('transitionend');
                }

                $content.add($bg).removeClass('visible');

                return true;
            } else {
                return false;
            }
        },
        closeAll: function() {
            var _ = this,
                $popup = $(this.selectors.popup + '.active'),
                $content = $popup.find('[data-js-popup-name]').filter('.show, .is-process-loading');
            
            if($content.length) {
                $content.each(function () {
                    _.closeByName($content.attr('data-js-popup-name'));
                });

                return true;
            } else {
                return false;
            }
        },
        cartItemAdded: function(title) {
            alert(theme.strings.general.popups.cart.item_added.replace('{{ title }}', title));
        },
        cartLimitIsExceeded: function(limit) {
            alert(theme.strings.general.popups.cart.limit_is_exceeded.replace('{{ limit }}', limit));
        },
        addHandler: function(name, event, func) {
            $body.on(event, '[data-js-popup-name="' + name + '"]', function(e, $popup, $target) {
                func($popup, $target);
            });
        },
        removeHandler: function(name, event) {
            $body.unbind(event);
        }
    });

    theme.Popups = new Popups;
};
theme.PopupAccount = function() {

    function PopupAccount() {
        this.settings = {
            popup_name: 'account'
        };

        this.selectors = {
            account: '.js-popup-account',
            show_sign_up: '.js-popup-account-show-sign-up'
        };

        this.load();
    };

    PopupAccount.prototype = $.extend({}, PopupAccount.prototype, {
        load: function() {
            var _ = this;

            $body.on('click', this.selectors.show_sign_up, function(e) {
                var $account = $(_.selectors.account);

                $account.find('.popup-account__login').addClass('d-none-important');
                $account.find('.popup-account__sign-up').removeClass('d-none-important');

                e.preventDefault();
                return false;
            });

            theme.Popups.addHandler(_.settings.popup_name, 'close.after', function() {
                var $account = $(_.selectors.account);

                $account.find('.popup-account__login').removeClass('d-none-important');
                $account.find('.popup-account__sign-up').addClass('d-none-important');
            });
        }
    });

    theme.PopupAccount = new PopupAccount;
};
theme.PopupSearch = function() {

    function PopupSearch() {
        this.settings = {
            popup_name: 'navigation'
        };

        this.selectors = {
            search: '.js-popup-search-ajax'
        };

        this.load();
    };

    PopupSearch.prototype = $.extend({}, PopupSearch.prototype, {
        load: function() {
            var _ = this,
                q = '',
                ajax;

            function resultToHTML($search, $results, data) {
                if(data.count > 0) {
                    var $template = $($('#template-search-ajax')[0].content),
                        $fragment = $(document.createDocumentFragment()),
                        limit = +$search.attr('data-js-max-products') - 1;

                    $.each(data.results, function(i) {
                        var $item = $template.clone(),
                            $image = $item.find('.product-search__image img'),
                            $title = $item.find('.product-search__title a'),
                            $price = $item.find('.product-search__price .price'),
                            $links = $item.find('a');

                        $links.attr('href', this.url);
                        $title.html(this.title);
                        $image.attr('srcset', this.thumbnail + ' 1x, ' + this.thumbnail2x + ' 2x');

                        if(this.price) {
                            theme.ProductCurrency.setPrice($price, this.price, this.compare_at_price);
                        } else {
                            $price.remove();
                        }

                        $fragment.append($item);

                        return i < limit;
                    });

                    $results.html('');
                    $results.append($fragment);

                    theme.ImagesLazyLoad.update();
                    theme.ProductCurrency.update();
                } else {
                    $results.html('');
                }

                $results[data.count > 0 ? 'removeClass' : 'addClass']('d-none-important');
            };

            function processResult($search, $content, q, data) {
                var $results = $search.find('.search__result'),
                    $view_all = $search.find('.search__view-all'),
                    $button_view_all = $view_all.find('a'),
                    $empty_result = $search.find('.search__empty'),
                    $menu_mobile = $('[data-js-menu-mobile]'),
                    $navigation = $('[data-js-popup-navigation-button]'),
                    navigation_button_status = q === '' ? 'close' : 'search';

                $button_view_all.attr('href', '/search?q=' + q);
                $view_all[data.count > 0 ? 'removeClass' : 'addClass']('d-none-important');
                $empty_result[q === '' || data.count > 0 ? 'addClass' : 'removeClass']('d-none-important');
                $menu_mobile[q === '' ? 'removeClass' : 'addClass']('d-none-important');

                $navigation.attr('data-js-popup-navigation-button', navigation_button_status);

                theme.Menu.closeMobileMenu();

                $results.addClass('invisible');

                resultToHTML($search, $results, data);

                $results.removeClass('invisible');

                theme.Loader.unset($search);
            };

            $body.on('keyup', this.selectors.search + ' input', $.debounce(500, function (e) {
                var $search = $(this).parents(_.selectors.search);

                if(e.keyCode !== 27) {
                    var $this = $(this),
                        value = $this.val(),
                        $content = $search.find('.search__content');

                    if(value !== q) {
                        q = value;

                        if(q === '') {
                            processResult($search, $content, q, { count: 0 });
                        } else {
                            if (ajax) {
                                ajax.abort();
                            }

                            theme.Loader.set($search);

                            processResult($search, $content, q, {
                                "count": 6,
                                "results": [{
                                        "url": "\/products\/copy-of-long-strappy-dress?variant=8078909538356",
                                        "title": "Ripped skinny jeans",
                                        "price": 33000,
                                        "compare_at_price": null,
                                        "thumbnail": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/0004916250_1_1_1_200x.jpg?v=1530810593",
                                        "thumbnail2x": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/0004916250_1_1_1_200x@2x.jpg?v=1530810593"
                                    }, {
                                        "url": "\/products\/copy-of-relaxed-fit-cotton-shirt?variant=8077662945332",
                                        "title": "Super skinny jeans",
                                        "price": 33500,
                                        "compare_at_price": null,
                                        "thumbnail": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/5333043427_1_1_1_200x.jpg?v=1542368814",
                                        "thumbnail2x": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/5333043427_1_1_1_200x@2x.jpg?v=1542368814"
                                    }, {
                                        "url": "\/products\/copy-of-ecologically-grown-cotton-t-shirt-with-slogan?variant=8078905442356",
                                        "title": "Low waist ripped jeans",
                                        "price": 25000,
                                        "compare_at_price": null,
                                        "thumbnail": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/0188388250_1_1_1_200x.jpg?v=1525100936",
                                        "thumbnail2x": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/0188388250_1_1_1_200x@2x.jpg?v=1525100936"
                                    }, {
                                        "url": "\/products\/copy-of-tailored-fit-polo-shirt?variant=8077663174708",
                                        "title": "Super skinny ripped jeans",
                                        "price": 31000,
                                        "compare_at_price": null,
                                        "thumbnail": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/0278211506_1_1_1_200x.jpg?v=1525093887",
                                        "thumbnail2x": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/products\/0278211506_1_1_1_200x@2x.jpg?v=1525093887"
                                    }, {
                                        "url": "\/blogs\/masonry\/what-i-wore-this-week-white-jeans",
                                        "title": "What I wore this week: white jeans",
                                        "thumbnail": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/articles\/06_200x.jpg?v=1542459754",
                                        "thumbnail2x": "https:\/\/cdn.shopify.com\/s\/files\/1\/0026\/2910\/7764\/articles\/06_200x@2x.jpg?v=1542459754"
                                    }
                                ]
                            });
                        }
                    }
                }
            }));

            function clear() {
                var $search = $(_.selectors.search),
                    $content = $search.find('.search__content');

                q = '';

                $search.find('input').val('');
                processResult($search, $content, q, { count: 0 });
            };

            $body.on('keyup', this.selectors.search + ' input', function(e) {
                if(e.keyCode === 27) {
                    var $search = $(this).parents(_.selectors.search),
                        $content = $search.find('.search__content');

                    q = '';

                    theme.Popups.closeByName('navigation');
                    processResult($search, $content, q, { count: 0 });
                }
            });

            theme.Popups.addHandler(this.settings.popup_name, 'close.before', function() {
                clear();
            });

            theme.Popups.addHandler(this.settings.popup_name, 'call.after', function($content) {
                if(theme.current.is_desktop) {
                    $content.find('input').focus();
                }
            });

            theme.Global.responsiveHandler({
                namespace: '.searchMobileBack',
                element: $body,
                delegate: '[data-js-popup-navigation-button="search"]',
                on_mobile: true,
                events: {
                    'click': function() {
                        clear();
                    }
                }
            });
        }
    });

    theme.PopupSearch = new PopupSearch;
};
theme.PopupCart = function() {

    function PopupCart() {
        this.settings = {
            popup_name: 'cart'
        };

        this.selectors = {
            cart: '.js-popup-cart-ajax'
        };

        this.load();
    };

    PopupCart.prototype = $.extend({}, PopupCart.prototype, {
        load: function() {
            var _ = this;

            theme.Popups.addHandler(this.settings.popup_name, 'call.visible', function($popup, $target) {
                _.update(function () {
                    $popup.trigger('contentloaded');
                });
            });
        },
        update: function(callback) {
            if(callback) {
                callback();
            }
        }
    });

    theme.PopupCart = new PopupCart;
};
theme.PopupQuickView = function() {

    function PopupQuickView() {
        this.settings = {
            popup_name: 'quick-view'
        };

        this.load();
    };

    PopupQuickView.prototype = $.extend({}, PopupQuickView.prototype, {
        load: function() {
            var _ = this;

            theme.Popups.addHandler(this.settings.popup_name, 'call.visible', function($popup, $target) {
                var $content = $popup.find('[data-js-quick-view]'),
                    $product = $target.parents('[data-js-product]');

                $content.html('');
                _.$gallery = null;

                _.getProduct($product, function (data) {
                    _.insertContent($content, data);

                    $popup.trigger('contentloaded');
                });
            });

            theme.Popups.addHandler(this.settings.popup_name, 'call.after', function($popup) {
                if(_.$gallery && _.$gallery.length) {
                    _.$gallery.productGallery('update');
                }

                if(theme.Tooltip) {
                    theme.Tooltip.init({
                        appendTo: $popup[0]
                    });
                }
            });

            theme.Popups.addHandler(this.settings.popup_name, 'close.after', function() {
                if (_.ajax) {
                    _.ajax.abort();
                }

                if(_.$gallery && _.$gallery.length) {
                    theme.ProductGallery.destroy(_.$gallery);
                    _.$gallery = null;
                }
            });
        },
        getProduct: function ($product, success) {
            if (this.ajax) {
                this.ajax.abort();
            }

            var handle = $product.attr('data-product-handle'),
                variant = $product.attr('data-product-variant-id');

            if(handle) {
                this.ajax = $.ajax({
                    type: 'GET',
                    url: 'https://shella-demo.myshopify.com/products/' + handle + '?variant=' + variant,
                    data: {
                        view: 'quick-view'
                    },
                    dataType: 'html',
                    success: function (data) {
                        success(data);
                    }
                });
            }
        },
        insertContent: function ($content, data) {
            data = data.replace(/\/\/cdn./g, 'https://cdn.');

            $content.html(data);

            var $product = $content.find('[data-js-product]'),
                $gallery = $product.find('[data-js-product-gallery]'),
                $countdown = $product.find('[data-js-product-countdown] .js-countdown'),
                $text_countdown = $product.find('.js-text-countdown'),
                $visitors = $product.find('.js-visitors');

            if($gallery.length) {
                this.$gallery = $gallery;

                theme.ProductGallery.init($gallery);
            }

            theme.ImagesLazyLoad.update();

            theme.ProductReview.update();

            if($countdown.length) {
                theme.ProductCountdown.init($countdown);
            }

            if($text_countdown.length) {
                theme.ProductTextCountdown.init($text_countdown);
            }
            
            if($visitors.length) {
                theme.ProductVisitors.init($visitors);
            }

            theme.StoreLists.checkProductStatus($product);
        }
    });

    theme.PopupQuickView = new PopupQuickView;
};
theme.ProductCurrency = function() {

    function ProductCurrency() {

    };

    ProductCurrency.prototype = $.extend({}, ProductCurrency.prototype, {
        load: function() {
            if(theme.multipleСurrencies) {
                var cookieCurrency;
                
                try {
                    cookieCurrency = Currency.cookie.read();
                } catch(err) {}
                
                $('span.money span.money').each(function () {
                    $(this).parents('span.money').removeClass('money');
                });

                $('span.money').each(function () {
                    $(this).attr('data-currency-' + Currency.shopCurrency, $(this).html());
                });

                if (cookieCurrency == null) {
                    if (Currency.shopCurrency !== Currency.defaultCurrency) {
                        Currency.convertAll(Currency.shopCurrency, Currency.defaultCurrency);
                    } else {
                        Currency.currentCurrency = Currency.defaultCurrency;
                    }
                } else if (cookieCurrency === Currency.shopCurrency) {
                    Currency.currentCurrency = Currency.shopCurrency;
                } else {
                    Currency.convertAll(Currency.shopCurrency, cookieCurrency);
                }
            }
        },
        setCurrency: function(newCurrency) {
            if(theme.multipleСurrencies) {
                if (newCurrency == Currency.currentCurrency) {
                    Currency.convertAll(Currency.shopCurrency, newCurrency);
                } else {
                    Currency.convertAll(Currency.currentCurrency, newCurrency);
                }
            }
        },
        setPrice: function($price, price, compare_at_price) {
            price = +price;
            compare_at_price = +compare_at_price;

            var html = '',
                sale = compare_at_price && compare_at_price > price;

            $price[sale ? 'addClass' : 'removeClass']('price--sale');

            if(sale) {
                html += '<span>';
                html += Shopify.formatMoney(compare_at_price, theme.moneyFormat);
                html += '</span>';

                if($price[0].hasAttribute('data-js-show-sale-separator')) {
                    html += theme.strings.priceSaleSeparator;
                }
            }

            html += '<span>';
            html += Shopify.formatMoney(price, theme.moneyFormat);
            html += '</span>';

            $price.html(html);
        },
        update: function() {
            if(theme.multipleСurrencies) {
                Currency.convertAll(Currency.shopCurrency, Currency.currentCurrency);
            }
        }
    });

    theme.ProductCurrency = new ProductCurrency;
};
theme.ProductQuantity = function() {

    function ProductQuantity() {
        this.selectors = {
            quantity: '.js-product-quantity'
        };

        this.load();
    };

    ProductQuantity.prototype = $.extend({}, ProductQuantity.prototype, {
        load: function() {
            var _ = this;

            $body.on('click', this.selectors.quantity + ' [data-control]', function(e) {
                var $this = $(this),
                    $quantity = $this.parents(_.selectors.quantity),
                    $input = $quantity.find('input'),
                    direction = $this.attr('data-control'),
                    min = $input.attr('min') || 1,
                    max = $input.attr('max') || Infinity,
                    val = +$input.val(),
                    set_val;

                if(!$.isNumeric(val)) {
                    $input.val(min);
                    return;
                }

                if(direction === '+') {
                    set_val = ++val;
                } else if(direction === '-') {
                    set_val = --val;
                }

                if(set_val < min) {
                    set_val = min;
                } else if(set_val > max) {
                    set_val = max;
                }

                if(set_val < 0) {
                    set_val = 0;
                }

                $input.val(set_val);
                $input.trigger('custom.change');

                _.dublicate($quantity);
            });

            $(document).on('keydown', this.selectors.quantity + ' input', function (e) {
                var keyArr = [8, 9, 27, 37, 38, 39, 40, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105];

                if($.inArray(e.keyCode, keyArr) === -1) {
                    e.preventDefault();
                    return false;
                }
            });

            $(document).on('focus', this.selectors.quantity + ' input', function () {
                $(this).select();
            });

            $(document).on('blur', this.selectors.quantity + ' input', function () {
                var $this = $(this),
                    $quantity = $this.parents(_.selectors.quantity),
                    val = +$this.val(),
                    min = $this.attr('min') || 1,
                    max = $this.attr('max') || Infinity;

                if(!$.isNumeric(val) || val < min) {
                    $this.val(min);
                } else if(val > max) {
                    $this.val(max);
                }

                _.dublicate($quantity);
            });
        },
        dublicate: function ($quantity) {
            var connect = $quantity.attr('data-js-quantity-connect');

            if($quantity.length && connect !== undefined) {
                var $input = $(this.selectors.quantity + '[data-js-quantity-connect="' + connect + '"]').find('input'),
                    value = $quantity.find('input').val();

                $input.val(value);
                $input.trigger('custom.change');
            }
        }
    });

    theme.ProductQuantity = new ProductQuantity;
};
theme.ProductCountdown = function() {

    function ProductCountdown() {
        this.selectors = {

        };

        this.load();
    };

    ProductCountdown.prototype = $.extend({}, ProductCountdown.prototype, {
        load: function() {
            this.init($('.js-countdown').not('.countdown--init'));
        },
        init: function($elems) {
            var $countdown = $elems.not('.countdown--init');

            $countdown.each(function () {
                var $this = $(this),
                    date = $this.data('date');

                if(!date) {
                    return;
                }

                var hideZero = $this.data('hidezero') || true;

                //remove timezone
                var remove_from = date.indexOf(' +');

                if(remove_from != -1) {
                    date = date.slice(0, remove_from);
                }
                //END:remove timezone

                var date_obj = new Date(date.replace(/-/g, "/"));

                if(date_obj.getTime() - new Date().getTime() <= 0) {
                    return;
                }

                var t = $this.countdown(date_obj, function (e) {
                    var format = '',
                        structure = [
                            ['totalDays', theme.strings.countdown.days],
                            ['hours', theme.strings.countdown.hours],
                            ['minutes', theme.strings.countdown.minutes],
                            ['seconds', theme.strings.countdown.seconds]
                        ];

                    for(var i = 0; i < structure.length; i++) {
                        var prop = structure[i][0],
                            time = e.offset[prop],
                            postfix = structure[i][1];

                        if (i === 0 && time === 0 && hideZero === true) {
                            continue;
                        }

                        if($this.hasClass('countdown--type-01')) {
                            format += '<span class="countdown__section">' +
                                '<span class="countdown__time">' + time + '</span>' +
                                '<span class="countdown__postfix">' + postfix + '</span>' +
                                '</span>';

                        } else if($this.hasClass('countdown--type-02')) {
                            if(time < 10) time = '0' + time;
                            else time += '';
                            
                            format += '<span class="countdown__section">' +
                                '<span class="countdown__time">';

                            for(var j = 0; j < time.length; j++) {
                                format += '<span>' + time.charAt(j) + '</span>';
                            }

                            format += '</span>' +
                                '<span class="countdown__postfix">' + postfix + '</span>' +
                                '</span>';
                        }
                    }

                    $(this).html(format);
                });

                $this.parents('[data-js-product-countdown]').removeClass('d-none-important');

                $this.addClass('countdown--init');
            });
        },
        destroy: function($countdown) {
            if($countdown.hasClass('countdown--init')) {
                $countdown.countdown('remove').off().removeClass('countdown--init').html('');
            }
        },
        reinit: function($countdown, date) {
            this.destroy($countdown);

            var $new_countdown = $countdown.clone();

            $countdown.replaceWith($new_countdown);

            $countdown.remove();

            if(date) {
                $new_countdown.attr('data-date', date);
            }

            this.init($new_countdown);
        }
    });

    theme.ProductCountdown = new ProductCountdown;
};
theme.ProductTextCountdown = function() {

    function ProductTextCountdown() {
        this.selectors = {

        };

        this.load();
    };

    ProductTextCountdown.prototype = $.extend({}, ProductTextCountdown.prototype, {
        load: function() {
            this.init($('.js-text-countdown').not('.text-countdown--init'));
        },
        init: function($elems) {
            var $countdown = $elems.not('.text-countdown--init');

            $countdown.each(function () {
                var $this = $(this),
                    $counter = $this.find('[data-js-text-countdown-counter]'),
                    $date = $this.find('[data-js-text-countdown-delivery]'),
                    reset_time = +$this.attr('data-reset-time'),
                    delivery_time = +$this.attr('data-delivery-time'),
                    hideZero = $this.attr('data-hidezero') || true,
                    date_counter = new Date(),
                    structure = [
                        ['hours', theme.strings.text_countdown.hours],
                        ['minutes', theme.strings.text_countdown.minutes]
                    ],
                    days_of_week = [
                        theme.strings.text_countdown.days_of_week.sunday,
                        theme.strings.text_countdown.days_of_week.monday,
                        theme.strings.text_countdown.days_of_week.tuesday,
                        theme.strings.text_countdown.days_of_week.wednesday,
                        theme.strings.text_countdown.days_of_week.thursday,
                        theme.strings.text_countdown.days_of_week.friday,
                        theme.strings.text_countdown.days_of_week.saturday
                    ],
                    date_now,
                    date_delivery,
                    delivery_html,
                    format,
                    prop,
                    time,
                    postfix;

                date_counter.setDate(date_counter.getDate() + 1);
                date_counter.setHours(reset_time, 0, 0, 0);

                var t = $counter.countdown(date_counter, function (e) {
                    format = '';
                    delivery_html = '';

                    for(var i = 0; i < structure.length; i++) {
                        prop = structure[i][0];
                        time = e.offset[prop];
                        postfix = structure[i][1];

                        if (i === 0 && time === 0 && hideZero === true) {
                            continue;
                        }

                        if(i !== 0) {
                            format += ' ';
                        }

                        format += time + ' ' + postfix;
                    }

                    $(this).html(format);

                    date_delivery = new Date();
                    date_delivery.setDate(date_delivery.getDate() + delivery_time);

                    date_now = new Date();

                    if(date_now.getHours() >= date_counter.getHours() && date_now.getMinutes() >= date_counter.getMinutes() && date_now.getSeconds() >= date_counter.getSeconds()) {
                        date_delivery.setDate(date_delivery.getDate() + 1);
                    }

                    delivery_html += days_of_week[date_delivery.getDay()];
                    delivery_html += ' ';
                    delivery_html += ('0' + date_delivery.getDate()).slice(-2) + '/' + ('0' + (date_delivery.getMonth() + 1)).slice(-2) + '/' + date_delivery.getFullYear();

                    $date.html(delivery_html);
                });

                $this.addClass('text-countdown--init');
            });
        },
        destroy: function($countdown) {
            if($countdown.hasClass('text-countdown--init')) {
                $countdown.countdown('remove').off().removeClass('text-countdown--init').html('');
            }
        }
    });

    theme.ProductTextCountdown = new ProductTextCountdown;
};
theme.ProductVisitors = function() {

    function ProductVisitors() {
        this.selectors = {

        };

        this.load();
    };

    ProductVisitors.prototype = $.extend({}, ProductVisitors.prototype, {
        load: function() {
            this.init($('.js-visitors').not('.visitors--init'));
        },
        init: function($elems) {
            var $countdown = $elems.not('.visitors--init');

            function randomInteger(min, max) {
                return Math.round(min - 0.5 + Math.random() * (max - min + 1));
            };

            $countdown.each(function () {
                var $this = $(this),
                    $counter = $this.find('[data-js-counter]'),
                    min = $this.attr('data-min'),
                    max = $this.attr('data-max'),
                    interval_min = $this.attr('data-interval-min'),
                    interval_max = $this.attr('data-interval-max'),
                    stroke = +$this.attr('data-stroke'),
                    current_value,
                    new_value;

                $this.addClass('visitors--processing');

                function update() {
                    setTimeout(function() {
                        if(!$this.hasClass('visitors--processing')) {
                            return;
                        }

                        current_value = +$counter.text();
                        new_value = randomInteger(min, max);

                        if(Math.abs(current_value - new_value) > stroke) {
                            new_value = new_value > current_value ? current_value + stroke : current_value - stroke;
                            new_value = randomInteger(current_value, new_value);
                        }

                        $counter.text(new_value);

                        update();
                    }, randomInteger(interval_min, interval_max) * 1000);
                };

                update();

                $this.addClass('visitors--init');
            });
        },
        destroy: function($countdown) {
            if($countdown.hasClass('visitors--init')) {
                $countdown.off().removeClass('visitors--processing visitors--init').html('');
            }
        }
    });

    theme.ProductVisitors = new ProductVisitors;
};
theme.ProductImagesNavigation = function() {

    function ProductImagesNavigation() {
        this.selectors = {
            images_nav: '.js-product-images-navigation'
        };

        this.load();
    };

    ProductImagesNavigation.prototype = $.extend({}, ProductImagesNavigation.prototype, {
        load: function() {
            var _ = this;

            $body.on('click', '[data-js-product-images-navigation]:not([data-disabled])', function() {
                var $this = $(this),
                    $product = $this.parents('[data-js-product]'),
                    direction = $this.attr('data-js-product-images-navigation');

                theme.ProductImagesHover.disable($product.find('img'));

                var data = theme.ProductOptions.switchByImage($product, direction, null, function (data) {
                    _._updateButtons($product, data.is_first, data.is_last);
                });
            });
        },
        switch: function($product, data) {
            var $image = $product.find('[data-js-product-image] img');

            if($image.length) {
                theme.ProductImagesHover.disable($image);

                var image = data.update_variant.featured_image;

                if(!image || !image.src) {
                    if(data.json.images[0]) {
                        image = data.json.images[0];
                    }
                }

                if(image && image.src && image.id !== $image.attr('data-image-id')) {
                    var src = Shopify.resizeImage(image.src, $image.width() + 'x') + ' 1x, ' + Shopify.resizeImage(image.src, $image.width() * 2 + 'x') + ' 2x';

                    this.changeSrc($image, src, image.id);

                    if($image.parents(this.selectors.images_nav).length) {
                        this._updateButtons($product, +data.json.images[0].id === +image.id, +data.json.images[data.json.images.length - 1].id === +image.id);
                    }
                }
            }
        },
        changeSrc: function ($image, srcset, id) {
            var $parent = $image.parent();

            id = id || 'null';

            theme.Loader.set($parent);

            $image.one('load', function () {
                theme.Loader.unset($parent);
            });
            
            $image.attr('srcset', srcset).attr('data-image-id', id);
        },
        _updateButtons: function($product, is_first, is_last) {
            $product.find('[data-js-product-images-navigation="prev"]')[is_first ? 'attr' : 'removeAttr']('data-disabled', 'disabled');
            $product.find('[data-js-product-images-navigation="next"]')[is_last ? 'attr' : 'removeAttr']('data-disabled', 'disabled');
        }
    });

    theme.ProductImagesNavigation = new ProductImagesNavigation;
};
theme.ProductImagesHover = function() {

    function ProductImagesHover() {
        this.selectors = {
            images_hover: '.js-product-images-hover',
            images_hovered_end: '.js-product-images-hovered-end'
        };

        this.load();
    };

    ProductImagesHover.prototype = $.extend({}, ProductImagesHover.prototype, {
        load: function() {
            function changeImage($wrap, $image, url, id) {
                var srcset = theme.ImagesLazyLoad.buildSrcset($image, url);

                $wrap.attr('data-js-product-image-hover-id', $image.attr('data-image-id'));

                theme.ProductImagesNavigation.changeSrc($image, srcset, id);
            };

            theme.Global.responsiveHandler({
                namespace: '.product-collection.images.hover',
                element: $body,
                delegate: this.selectors.images_hover,
                on_desktop: true,
                events: {
                    'mouseenter': function() {
                        var $this = $(this),
                            $image = $this.find('img'),
                            url = $this.attr('data-js-product-image-hover'),
                            id = $this.attr('data-js-product-image-hover-id');

                        if(url) {
                            changeImage($this, $image, url, id);

                            $this.one('mouseleave', function () {
                                var url = $image.attr('data-master'),
                                    id = $this.attr('data-js-product-image-hover-id');
                                
                                changeImage($this, $image, url, id);
                            });
                        }
                    }
                }
            });

            theme.Global.responsiveHandler({
                namespace: '.product-collection.images.hoveredend',
                element: $body,
                delegate: this.selectors.images_hovered_end,
                on_desktop: true,
                events: {
                    'mouseenter': function() {
                        var $this = $(this),
                            timeout;

                        timeout = setTimeout(function () {
                            $this.addClass('hovered-end');
                        }, theme.animations.css.duration * 1000);

                        $this.one('mouseleave', function () {
                            clearTimeout(timeout);
                        });
                    },
                    'mouseleave': function() {
                        $(this).removeClass('hovered-end');
                    }
                }
            });
        },
        disable: function ($image) {
            $image.parents(this.selectors.images_hover).removeClass('js-product-images-hover').unbind('mouseleave');
        }
    });

    theme.ProductImagesHover = new ProductImagesHover;
};
theme.ProductOptions = function() {

    function ProductOptions() {
        this.selectors = {
            options: '.js-product-options',
            options_attr: '[data-js-product-options]'
        };

        this.afterChange = [];

        this.load();
    };

    ProductOptions.prototype = $.extend({}, ProductOptions.prototype, {
        load: function() {
            var _ = this,
                timeout,
                xhr;

            function onProcess(e) {
                var $this = $(this);

                if ($this.hasClass('active') || $this.hasClass('disabled')) {
                    return;
                }

                var $options = $this.parents(_.selectors.options),
                    $section = $this.parents('[data-property]'),
                    $values = $section.find('[data-js-option-value]'),
                    $product = $this.parents('[data-js-product]'),
                    json = $product.attr('data-json-product'),
                    current_values = {},
                    update_variant = null,
                    is_avilable = true;

                if(e.type === 'click') {
                    $values.removeClass('active');
                    $this.addClass('active');
                }

                _._loadJSON($product, json, function (json) {
                    var $active_values = $options.find('[data-js-option-value].active').add($options.find('option:selected'));

                    $.each($active_values, function() {
                        var $this = $(this);

                        current_values[$this.parents('[data-property]').data('property')] = '' + $this.data('value');
                    });

                    $.each(json.variants, function() {
                        var variant_values = {},
                            current_variant = true;

                        $.each(this.options, function(i) {
                            variant_values[theme.Global.handleize(json.options[i])] = theme.Global.handleize(this);
                        });

                        $.each(current_values, function(i) {
                            if(current_values[i] !== variant_values[i]) {
                                current_variant = false;
                                return false;
                            }
                        });

                        if(current_variant && current_values.length === variant_values.length) {
                            update_variant = this;
                            return false;
                        }
                    });

                    if(!update_variant) {
                        update_variant = _._getDefaultVariant(json);
                        is_avilable = false;
                    }

                    _._switchVariant($product, {
                        update_variant: update_variant,
                        json: json,
                        current_values: current_values,
                        is_avilable: is_avilable
                    });
                });
            };

            $body.on('click', this.selectors.options + ' [data-js-option-value]', onProcess);

            $body.on('mouseenter', this.selectors.options + '[data-js-options-onhover] [data-js-option-value]', $.debounce(400, onProcess));

            $body.on('change', '[data-js-option-select]', function (e, onupdate) {
                if(onupdate) {
                    return;
                }
                
                var $this = $(this).find('option:selected');

                onProcess.call($this, e);
            });

            $body.on('change', '[data-js-product-variants="control"]', function () {
                var $this = $(this),
                    $product = $this.parents('[data-js-product]'),
                    id = $this.find('option:selected').attr('value'),
                    json = $product.attr('data-json-product'),
                    update_variant = null,
                    is_avilable = true;

                _._loadJSON($product, json, function (json) {
                    $.each(json.variants, function() {
                        if(+this.id === +id) {
                            update_variant = this;
                            return false;
                        }
                    });

                    if(!update_variant) {
                        update_variant = _._getDefaultVariant(json);
                        is_avilable = false;
                    }
                    
                    _._switchVariant($product, {
                        update_variant: update_variant,
                        json: json,
                        is_avilable: is_avilable,
                        dontUpdateVariantsSelect: true
                    });
                });
            });

            theme.Global.responsiveHandler({
                namespace: '.product.load-json',
                element: $body,
                delegate: '[data-js-product][data-js-product-json-preload]',
                on_desktop: true,
                events: {
                    'mouseenter': function() {
                        var $this = $(this);

                        clearTimeout(timeout);

                        timeout = setTimeout(function () {
                            if(!$this.attr('data-json-product')) {
                                xhr = _._loadJSON($this, null, function() {
                                    xhr = null;
                                }, false);
                            }
                        }, 300);
                    },
                    'mouseleave': function() {
                        clearTimeout(timeout);

                        if(xhr) {
                            xhr.abort();
                            xhr = null;
                        }
                    }
                }
            });
        },
        _loadJSON: function ($product, json, callback, animate) {
            if($product[0].hasAttribute('data-js-process-ajax-loading-json')) {
                $product.one('json-loaded', function () {
                    if(callback) {
                        callback(JSON.parse($product.attr('data-json-product')));
                    }
                });

                return;
            }

            animate = animate === undefined ? true : animate;

            if(json) {
                if(callback) {
                    callback(typeof json == 'object' ? json : JSON.parse(json));
                }
            } else {
                $product.attr('data-js-process-ajax-loading-json', true);

                if(animate) {
                    theme.Loader.set($product);
                }

                var handle = $product.attr('data-product-handle');

                var xhr = $.ajax({
                    type: 'GET',
                    url: 'https://shella-demo.myshopify.com/products/' + handle,
                    data: {
                        view: 'get_json'
                    },
                    cache: false,
                    dataType: 'html',
                    success: function (data) {
                        data = data.replace(/\/\/cdn./g, 'https://cdn.');
                        json = JSON.parse(data);
                        $product.attr('data-json-product', JSON.stringify(json));

                        if(animate) {
                            theme.Loader.unset($product);
                        }

                        if(callback) {
                            callback(json);
                        }

                        $product.trigger('json-loaded');
                    },
                    complete: function () {
                        $product.removeAttr('data-js-process-ajax-loading-json');
                    }
                });

                return xhr;
            }
        },
        switchByImage: function($product, get_image, id, callback) {
            var _ = this,
                $image = $product.find('[data-js-product-image] img'),
                json = $product.attr('data-json-product'),
                data = false;

            this._loadJSON($product, json, function (json) {
                var json_images = json.images,
                    current_image_id = (get_image === 'by_id') ? +id : +$image.attr('data-image-id'),
                    image_index,
                    update_variant,
                    is_avilable = true;

                $.each(json_images, function(i) {
                    if(+this.id === current_image_id) {
                        image_index = i;
                        return false;
                    }
                });

                if(image_index || image_index === 0) {
                    if(get_image === 'prev' && image_index !== 0) {
                        image_index--;
                    } else if(get_image === 'next' && image_index !== json_images.length - 1) {
                        image_index++;
                    }

                    $.each(json.variants, function() {
                        if(this.featured_image && +this.featured_image.id === +json_images[image_index].id) {
                            update_variant = this;
                            return false;
                        }
                    });

                    if(!update_variant) {
                        update_variant = _._getDefaultVariant(json);
                        update_variant.featured_image = json_images[image_index];
                    }

                    _._updateOptions($product, {
                        update_variant: update_variant,
                        json: json
                    });
                    
                    _._switchVariant($product, {
                        update_variant: update_variant,
                        json: json,
                        is_avilable: is_avilable
                    });

                    data = {
                        index: image_index,
                        image: json_images[image_index],
                        is_first: image_index === 0,
                        is_last: image_index === json_images.length - 1
                    };
                }

                callback(data);
            });
        },
        _switchVariant: function($product, data) {
            data.update_variant.metafields = $.extend({}, data.json.metafields);

            $.each(data.json.variants_metafields, function() {
                if(+this.variant_id === +data.update_variant.id) {
                    data.update_variant.metafields = $.extend(true, data.update_variant.metafields, this.metafields);
                }
            });

            $product.attr('data-product-variant-id', data.update_variant.id);

            this._updateContent($product, data);
        },
        _getDefaultVariant: function(json) {
            var default_variant = {};

            $.each(json.variants, function() {
                if(+this.id === +json.default_variant_id) {
                    Object.assign(default_variant, this);
                    return false;
                }
            });

            return default_variant;
        },
        _updateContent: function($product, data) {
            var clone_id = $product.attr('data-js-product-clone-id'),
                $clone_product = $('[data-js-product-clone="' + clone_id + '"]');

            this._updateFormVariantInput($product, data);
            this._updatePrice($product, $clone_product, data);
            this._updateLabelSale($product, data);
            this._updateLabelInStock($product, data);
            this._updateLabelOutStock($product, data);
            this._updateLabelHot($product, data);
            this._updateLabelNew($product, data);
            this._updateCountdown($product, data);
            this._updateAddToCart($product, $clone_product, data);
            this._updateSKU($product, data);
            this._updateBarcode($product, data);
            this._updateAvailability($product, data);
            this._updateStockCountdown($product, data);
            this._updateGallery($product, data);
            this._updateLinks($product, data);
            this._updateHistory($product, data);

            theme.StoreLists.checkProductStatus($product);
            theme.ProductImagesNavigation.switch($product, data);

            if(!data.dontUpdateVariantsSelect) {
                this._updateVariantsSelect($product, data);
            }

            if($clone_product.length) {
                this._updateOptions($clone_product, data, true);
                theme.ProductImagesNavigation.switch($clone_product, data);
            }
        },
        _updateOptions: function($product, data, set_current) {
            var $options = $product.find(this.selectors.options_attr);

            if($options.length) {
                $options.find('[data-js-option-value]').removeClass('active');

                if(set_current) {
                    $.each(data.current_values, function(i, k) {
                        $options.find('[data-property="' + i + '"] [data-js-option-value][data-value="' + k + '"]').addClass('active');
                        $options.find('[data-js-option-select][data-property="' + i + '"]').val(k).trigger('change', [ true ]);
                    });
                } else {
                    $.each(data.json.options, function(i) {
                        $options.find('[data-property="' + theme.Global.handleize(this) + '"] [data-js-option-value][data-value="' + theme.Global.handleize(data.update_variant.options[i]) + '"]').addClass('active');
                        $options.find('[data-js-option-select][data-property="' + theme.Global.handleize(this) + '"]').val(data.update_variant.options[i]).trigger('change', [ true ]);
                    });
                }
            }
        },
        _updateFormVariantInput: function ($product, data) {
            var $input = $product.find('[data-js-product-variant-input]');

            $input.attr('value', data.update_variant.id);
        },
        _updateVariantsSelect: function($product, data) {
            var $select = $product.find('[data-js-product-variants]');

            if($select.length) {
                $select.val(data.update_variant.id).change();
            }
        },
        _updateAddToCart: function($product, $clone_product, data) {
            var $button = $product.add($clone_product).find('[data-js-product-button-add-to-cart]');
            
            if($button.length) {
                data.is_avilable && data.update_variant.available ? $button.removeAttr('disabled data-button-status') : $button.attr('disabled', 'disabled').attr('data-button-status', 'sold-out');
            }
        },
        _updatePrice: function($product, $clone_product, data) {
            var $price = $product.add($clone_product).find('[data-js-product-price]'),
                $details = $product.find('[data-js-product-price-sale-details]');

            if($price.length) {
                theme.ProductCurrency.setPrice($price, data.update_variant.price, data.update_variant.compare_at_price);
            }

            if($details.length) {
                var details;

                $.each(data.json.variants_price_sale_details, function () {
                    if(+this.id === +data.update_variant.id) {
                        details = this.details;
                    }
                });

                $details.html(details ? details : '')[details ? 'removeClass' : 'addClass']('d-none-important');
            }

            if($price.length || $details.length) {
                theme.ProductCurrency.update();
            }
        },
        _updateLabelSale: function($product, data) {
            var $label = $product.find('[data-js-product-label-sale]');
            
            if($label.length) {
                var html = '',
                    sale = (data.update_variant.compare_at_price && data.update_variant.compare_at_price > data.update_variant.price);

                $label[!sale ? 'addClass' : 'removeClass']('d-none-important');

                if(sale) {
                    var percent = Math.round(100 - data.update_variant.price * 100 / data.update_variant.compare_at_price);
                    html += theme.strings.label.sale;
                    html = html.replace('{{ percent }}', percent);
                }

                $label.html(html);
            }
        },
        _updateLabelInStock: function($product, data) {
            var $label = $product.find('[data-js-product-label-in-stock]');

            if($label.length) {
                $label[!data.update_variant.available ? 'addClass' : 'removeClass']('d-none-important');
            }
        },
        _updateLabelOutStock: function($product, data) {
            var $label = $product.find('[data-js-product-label-out-stock]');

            if($label.length) {
                $label[data.update_variant.available ? 'addClass' : 'removeClass']('d-none-important');
            }
        },
        _updateLabelHot: function($product, data) {
            var $label = $product.find('[data-js-product-label-hot]');

            if($label.length) {
                $label[data.update_variant.metafields.labels && data.update_variant.metafields.labels.hot ? 'removeClass' : 'addClass']('d-none-important');
            }
        },
        _updateLabelNew: function($product, data) {
            var $label = $product.find('[data-js-product-label-new]');

            if($label.length) {
                $label[data.update_variant.metafields.labels && data.update_variant.metafields.labels.new ? 'removeClass' : 'addClass']('d-none-important');
            }
        },
        _updateCountdown: function($product, data) {
            var $countdown = $product.find('[data-js-product-countdown]'),
                date = data.update_variant.metafields.countdown && data.update_variant.metafields.countdown.date ? data.update_variant.metafields.countdown.date : false,
                $countdown_init,
                need_coundown;

            if($countdown.length) {
                $countdown_init = $countdown.find('.js-countdown');
                need_coundown = date && data.update_variant.compare_at_price && data.update_variant.compare_at_price > data.update_variant.price;

                if(need_coundown && $countdown_init.attr('data-date') !== date) {
                    theme.ProductCountdown.reinit($countdown_init, date);
                }

                if(!need_coundown) {
                    $countdown.addClass('d-none-important');
                }
            }
        },
        _updateSKU: function($product, data) {
            var $sku = $product.find('[data-js-product-sku]');

            if($sku.length) {
                $sku[data.update_variant.sku ? 'removeClass' : 'addClass']('d-none-important');

                $sku.find('span').html(data.update_variant.sku);
            }
        },
        _updateBarcode: function($product, data) {
            var $barcode = $product.find('[data-js-product-barcode]');

            if($barcode.length) {
                $barcode[data.update_variant.barcode ? 'removeClass' : 'addClass']('d-none-important');

                $barcode.find('span').html(data.update_variant.barcode);
            }
        },
        _updateAvailability: function($product, data) {
            var $availability = $product.find('[data-js-product-availability]');

            if($availability.length) {
                var html = '',
                    quantity = 0;

                $.each(data.json.variants_quantity, function() {
                    if(+this.id === +data.update_variant.id) {
                        quantity = +this.quantity;
                    }
                });

                if(data.update_variant.available) {
                    html += theme.strings.availability_value_in_stock;
                    html = html.replace('{{ count }}', quantity);
                    html = html.replace('{{ item }}', quantity === 1 ? theme.strings.layout.cart.items_count.one : theme.strings.layout.cart.items_count.other);
                } else {
                    html += theme.strings.availability_value_out_stock;
                }

                $availability.attr('data-availability', data.update_variant.available).find('span').html(html);
            }
        },
        _updateStockCountdown: function ($product, data) {
            var $stock_countdown = $product.find('[data-js-product-stock-countdown]'),
                $title = $stock_countdown.find('[data-js-product-stock-countdown-title]'),
                $progress = $stock_countdown.find('[data-js-product-stock-countdown-progress]'),
                min = +$stock_countdown.attr('data-min'),
                quantity = 0;

            $.each(data.json.variants_quantity, function () {
                if(+this.id === +data.update_variant.id) quantity = +this.quantity;
            });

            if($title) {
                $title.html(theme.strings.stock_countdown.title.replace('{{ quantity }}', '<span class="stock-countdown__counter">' + quantity + '</span>'));
            }

            if($progress) {
                $progress.width(quantity / (min / 100) + '%');
            }

            if($stock_countdown.length) {
                $stock_countdown[quantity > 0 && quantity < min ? 'removeClass' : 'addClass']('d-none-important');
            }
        },
        _updateGallery: function ($product, data) {
            var $gallery = $product.find('[data-js-product-gallery]');

            if($gallery.find('.fotorama').length) {
                var image = data.update_variant.featured_image;

                if(!image || !image.src) {
                    if(data.json.images[0]) {
                        image = data.json.images[0];
                    }
                }

                $gallery.productGallery('switchImageById', image.id);
            }
        },
        _updateLinks: function ($product, data) {
            var url = decodeURIComponent(window.location.origin) + '/products/' + data.json.handle + '?variant=' + data.update_variant.id;

            $product.find('a[href*="products/' + data.json.handle + '"]').attr('href', url);
        },
        _updateHistory: function ($product, data) {
            var $options = $product.find(this.selectors.options);

            if($options.length && $options[0].hasAttribute('data-js-change-history')) {
                var url = decodeURIComponent(window.location.origin) + '/products/' + data.json.handle + '?variant=' + data.update_variant.id;
            }
        }
    });

    theme.ProductOptions = new ProductOptions;
};
theme.ProductReview = function() {

    function ProductReview() {

    };

    ProductReview.prototype = $.extend({}, ProductReview.prototype, {
        update: function() {
            
        }
    });

    theme.ProductReview = new ProductReview;
};
theme.ProductGallery = function() {

    function ProductGallery() {
        this.load();
    };

    ProductGallery.prototype = $.extend({}, ProductGallery.prototype, {
        load: function() {
            $.widget( 'ui.productGallery', {
                options: {
                    bp: 1024,
                    bp_slick: 1024,
                    fotorama: {
                        size: 3,
                        nav: false,
                        arrows: false,
                        allowfullscreen: true,
                        auto: false,
                        shadows: false,
                        transition: 'slide',
                        clicktransition: 'crossfade'
                    },
                    slick: {
                        preview: {
                            lazyLoad: false,
                            vertical: true,
                            verticalSwiping: true,
                            slidesToShow: 6,
                            slidesToScroll: 6,
                            dots: false,
                            arrows: true,
                            infinite: false,
                            touchMove: false,
                            responsive: [
                                {
                                    breakpoint: 1259,
                                    settings: {
                                        slidesToShow: 4,
                                        slidesToScroll: 4
                                    }
                                }
                            ]
                        },
                        panorama: {
                            lazyLoad: false,
                            slidesToShow: 3,
                            slidesToScroll: 1,
                            customPaging: '10px',
                            dots: false,
                            arrows: true,
                            infinite: false,
                            touchMove: false,
                            responsive: [
                                {
                                    breakpoint: 1024,
                                    settings: {
                                        slidesToShow: 2
                                    }
                                },
                                {
                                    breakpoint: 779,
                                    settings: {
                                        slidesToShow: 2
                                    }
                                },
                                {
                                    breakpoint: 542,
                                    settings: {
                                        slidesToShow: 1
                                    }
                                }
                            ]
                        }
                    },
                    zoom: {
                        zoomType: "inner",
                        cursor: "crosshair",
                        easing : true,
                        zoomWindowFadeIn: 150,
                        zoomWindowFadeOut: 150
                    },
                    zoomEnable: true,
                    arrows: true,
                    btnZoom: false,
                    fullscreen: true
                },
                _create: function() {
                    this.$gallery = this.element;
                    this.$main = this.$gallery.find('[data-js-product-gallery-main]');
                    this.$preview = this.$gallery.find('[data-js-product-gallery-preview]');
                    this.$collage = this.$gallery.find('[data-js-product-gallery-collage]');
                    this.preview_type = this.$preview.attr('data-type');
                    this.$main_act_img = null;
                    this.$zoomWrapper = this.$gallery.find('[data-js-product-gallery-zoom]');
                    this.slick_state = null;
                    this.zoom_activate = true;
                    this.zoom_state = false;
                    this.id = 'id' + Math.ceil(Math.random() * 10000000);
                    this.index_id_obj = this.$main.data('index-id');
                    this.zoom_src = this.$main.data('zoom-images');

                    var _ = this,
                        arrows = this.$main.data('arrows'),
                        fullscreen = this.$main.data('fullscreen'),
                        zoom = this.$main.data('zoom'),
                        active_image = this.$gallery.data('active-image');

                    if(arrows != undefined) {
                        this.options.arrows = arrows;
                    }

                    if(fullscreen != undefined) {
                        this.options.fullscreen = fullscreen;
                    }

                    if(zoom != undefined) {
                        this.options.zoomEnable = zoom;
                    }

                    if(active_image != undefined) {
                        this.options.fotorama.startindex = active_image;
                        this.options.slick.initialSlide = active_image;
                    }

                    this.options.fotorama.allowfullscreen = this.options.fullscreen;

                    if(this.$main.find('img').length === 1) {
                        this.$main.addClass('product-page-gallery__main--single');
                    }

                    this.fotorama = this.$main.fotorama(this.options.fotorama).data('fotorama');

                    if(this.options.fullscreen) {
                        this.$btn_full = this.$gallery.find('[data-js-product-gallery-btn-fullscreen]');

                        this.$main.on({
                            'fotorama:fullscreenenter': function () {
                                _._zoomDestroy();
                            },
                            'fotorama:fullscreenexit': function () {
                                _._checkSlick();
                                _._checkCollage();

                                _._zoomInit();
                            }
                        });

                        this.$btn_full.on('click', function() {
                            _.fotorama.requestFullScreen();
                        });
                    }

                    if(this.options.btnZoom) {
                        this.$btn_zoom_toggle = $('<div>').addClass('fotorama__btn-zoom').append($('<i>').addClass('icon-zoom-in'));

                        this.$main.append(this.$btn_zoom_toggle);

                        this.$btn_zoom_toggle.on('click', function() {
                            if(_.zoom_state) _.zoomToggle('off');
                            else _.zoomToggle('on');
                        });
                    }

                    if(this.options.arrows) {
                        this.$arrow_prev = this.$gallery.find('[data-js-product-gallery-main-btn-prev]');
                        this.$arrow_next = this.$gallery.find('[data-js-product-gallery-main-btn-next]');

                        this.$arrow_prev.on('click', function() {
                            _._setEffect('crossfade', function() {
                                _.fotorama.show('<');
                            });
                        });

                        this.$arrow_next.on('click', function() {
                            _._setEffect('crossfade', function() {
                                _.fotorama.show('>');
                            });
                        });
                    }

                    //slick
                    this.$prev_slides = this.$preview.find('[data-js-product-gallery-preview-image]');

                    this.$preview.on('init', function() {
                        _.$preview.removeClass('invisible');
                    });

                    this.$preview.one('init', function() {
                        _.slick_is_init = true;
                    });

                    this.$preview.on('mousedown', '.slick-slide', function() {
                        $(this).one({
                            'mouseup': function(e) {
                                var $this = $(this);

                                _.switchImage($this);
                            }
                        });
                    });

                    //collage
                    this.$collage_slides = this.$collage.find('[data-js-product-gallery-preview-image]');

                    this.$collage.on('click', '[data-js-product-gallery-preview-image]', function() {
                        var $this = $(this);

                        _.switchImage($this);
                    });

                    this.$gallery.on('click', '[data-js-product-gallery-btn-video]', function () {
                        _.switchImage(null, 'video');
                    });

                    this._slickInit();

                    this.$gallery.addClass('product-page-gallery--loaded');

                    function fotoramaChangeEvent() {
                        _.$main.on('fotorama:show.change', function(e, fotorama) {
                            _.$main.unbind('fotorama:showend.change fotorama:load.change');

                            _._zoomDestroy();

                            _._checkBtns(fotorama);

                            _.$main.one('fotorama:load.change', function() {
                                _._zoomInit();
                            });

                            _.$main.one('fotorama:showend.change', function(e, fotorama) {
                                if(_.$main.find('.fotorama__active img').attr('src')) {
                                    _.$main.trigger('fotorama:load.change');
                                }

                                _._checkSlick();
                                _._checkCollage();
                            });
                        });
                    };

                    this.$main.one('fotorama:load', function(e, fotorama) {
                        _._zoomInit();

                        _._checkBtns(fotorama);

                        fotoramaChangeEvent();

                        _.$main.removeClass('invisible');

                        _.fotorama_is_init = true;
                    });

                    $(window).on('theme.changed.breakpoint.productgallery' + this.id, function() {
                        _._slickInit();
                        _._checkSlick();
                        _._checkCollage();
                        _._zoomDestroy();
                        _._zoomInit();
                    });
                },
                _slickInit: function() {
                    var this_state = window.innerWidth > this.options.bp_slick ? true : false;

                    if(this_state !== this.slick_state) {
                        if(this.preview_type === 'panorama' || this_state) {
                            if(this.$preview.hasClass('slick-initialized')) {
                                this.$preview.slick('setPosition');
                            } else {
                                if(this.preview_type === 'panorama') {
                                    var preview_obj = this.options.slick.panorama;
                                } else {
                                    var preview_obj = this.options.slick.preview;

                                    var slidesToShow = this.$preview.attr('data-slides-to-show');

                                    if(slidesToShow !== undefined) {
                                        preview_obj.slidesToShow = +slidesToShow;
                                    }
                                }

                                this.$preview.slick($.extend(preview_obj, {
                                    prevArrow: this.$gallery.find('[data-js-product-gallery-preview-btn-prev]'),
                                    nextArrow: this.$gallery.find('[data-js-product-gallery-preview-btn-next]')
                                }));
                            }
                        } else {
                            if(this.$preview.hasClass('slick-initialized')) {
                                this.$preview.addClass('invisible');
                                this.$preview.slick('destroy');
                            }
                            this.slick_is_init = true;
                        }

                        this.slick_state = this_state;
                    }
                },
                _checkSlick: function(image_id) {
                    if(this.$main.hasClass('fotorama--fullscreen') || !this.$preview.hasClass('slick-initialized')) {
                        return;
                    }

                    if(!image_id) {
                        if(!this.fotorama) {
                            return;
                        }

                        image_id = this.index_id_obj[this.fotorama.activeIndex];
                    }

                    var $current_slide = this.$prev_slides.filter('[data-js-product-gallery-image-id="' + image_id + '"]'),
                        slide_index = this.$prev_slides.index($current_slide);

                    this.$prev_slides.removeClass('current');
                    $current_slide.addClass('current');
                    this.$preview.slick('slickGoTo', slide_index);
                },
                _checkCollage: function (image_id) {
                    if(this.$main.hasClass('fotorama--fullscreen') || !this.$collage.length) {
                        return;
                    }

                    if(!image_id) {
                        if(!this.fotorama) {
                            return;
                        }

                        image_id = this.index_id_obj[this.fotorama.activeIndex];
                    }

                    var $current_slide = this.$collage_slides.filter('[data-js-product-gallery-image-id="' + image_id + '"]');

                    this.$collage_slides.removeClass('current');
                    $current_slide.addClass('current');
                },
                _checkBtns: function(fotorama) {
                    if(this.options.arrows) {
                        var index = fotorama.activeFrame.i;

                        if(index === 1) this.$arrow_prev.addClass('disabled');
                        else this.$arrow_prev.removeClass('disabled');

                        if(index === fotorama.size) this.$arrow_next.addClass('disabled');
                        else this.$arrow_next.removeClass('disabled');
                    }
                },
                _zoomInit: function () {
                    var _ = this;
                    
                    this.$main_act_img = this.$main.find('.fotorama__active').not('fotorama__stage__frame--video').find('.fotorama__img').not('.fotorama__img--full');

                    function replaceCont() {
                        setTimeout(function() {
                            _.$zoomContainer = $('body > .zoomContainer');
                            if(_.$zoomContainer.length) _.$zoomContainer.appendTo(_.$zoomWrapper);
                            else replaceCont();
                        }, 20);
                    };

                    if(this.fotorama && this.options.zoomEnable && this.$main_act_img.length && window.innerWidth > this.options.bp && this.zoom_activate && !this.$main.hasClass('fotorama--fullscreen')) {
                        var set_zoom_src = this.zoom_src[this.fotorama.activeIndex];

                        if(!set_zoom_src) return;

                        this.$main_act_img.attr('data-zoom-image', set_zoom_src);

                        this.$main_act_img.elevateZoom(this.options.zoom);

                        replaceCont();

                        this.$zoomWrapper.removeClass('d-none-important');

                        this.$main.addClass('fotorama--zoom');

                        this.zoom_state = true;
                    }
                },
                _zoomDestroy: function () {
                    if(this.options.zoomEnable && this.zoom_state && this.$main_act_img.length && this.$zoomContainer) {
                        $.removeData(this.$main_act_img, 'elevateZoom');
                        this.$main_act_img.removeAttr('data-zoom-image');

                        this.$zoomContainer.remove();
                        this.$zoomContainer = null;

                        this.$zoomWrapper.addClass('d-none-important');

                        this.$main.removeClass('fotorama--zoom');

                        this.zoom_state = false;
                    }
                },
                zoomToggle: function(state) {
                    if(this.$btn_zoom_toggle) {
                        var $icon = this.$btn_zoom_toggle.find('i');

                        $icon.removeAttr('class');

                        if(state === 'on') {
                            $icon.addClass('icon-zoom-in');

                            this.zoom_activate = true;

                            this._zoomInit();
                        } else if(state === 'off') {
                            $icon.addClass('icon-zoom-out');

                            this.zoom_activate = false;

                            this._zoomDestroy();
                        }
                    }
                },
                _setEffect: function(effect, func) {
                    var _ = this;

                    this.fotorama.setOptions({ transition: effect });

                    func();

                    this.$main.one('fotorama:showend', function() {
                        _.fotorama.setOptions({ transition: 'slide' });
                    });
                },
                switchImage: function($slide, image_id) {
                    if($slide && $slide.hasClass('current')) return;

                    var _ = this,
                        image_id = image_id || $slide.data('js-product-gallery-image-id');

                    if(this.fotorama) {
                        (function recurs_wait() {
                            if(_.fotorama_is_init) {
                                var index = 0,
                                    i = 0;

                                for(; i < _.index_id_obj.length; i++) {
                                    if(_.index_id_obj[i] == image_id) index = i;
                                }

                                _._setEffect('crossfade', function() {
                                    _.fotorama.show(index);
                                });
                            } else {
                                _.$main.one('fotorama:load', function() {
                                    recurs_wait();
                                });

                                _.$preview.on('init', function() {
                                    recurs_wait();
                                });
                            }
                        })();
                    } else if(this.preview_type === 'panorama') {
                        this._checkSlick(image_id);
                    }
                },
                switchImageById: function(image_id) {
                    var _ = this,
                        $slides = this.$prev_slides.add(this.$collage_slides),
                        $slide = $slides.filter('[data-js-product-gallery-image-id="' + image_id + '"]');

                    _.switchImage($slide);
                },
                update: function () {
                    if(this.$preview.hasClass('slick-initialized')) {
                        this.$preview.slick('setPosition');
                    }
                },
                _init: function () {

                },
                _setOption: function(key, value) {
                    $.Widget.prototype._setOption.apply(this, arguments);
                },
                destroy: function() {
                    this._zoomDestroy();

                    this.$preview.unbind('mousedown');

                    this.$preview.slick('destroy');

                    $(this.$gallery, this.$btn_full, this.$arrow_prev, this.$arrow_next, this.$btn_zoom_toggle).off().remove();

                    this.fotorama.destroy();

                    $(window).unbind('theme.changed.breakpoint.productgallery' + this.id);

                    $.Widget.prototype.destroy.call(this);
                }
            });
        },
        init: function ($gallery) {
            if(!$gallery.hasClass('product-page-gallery--loaded')) {
                $gallery.productGallery();
            }
        },
        destroy: function ($gallery) {
            if($gallery.hasClass('product-page-gallery--loaded')) {
                $gallery.productGallery('destroy');
            }
        }
    });

    theme.ProductGallery = new ProductGallery;
};
theme.Cart = function() {

    function Cart() {
        this.selectors = {
            button_add: '.js-product-button-add-to-cart',
            button_remove: '.js-product-button-remove-from-cart'
        };

        this.load();
    };

    Cart.prototype = $.extend({}, Cart.prototype, {
        load: function() {
            var _ = this;

            function callback($button) {
                var limit_is_exceeded = false,
                    current_variant,
                    clone_id = $button.attr('data-js-button-add-to-cart-clone-id');
                
                if(clone_id !== undefined) {
                    $button = $button.add($('[data-js-button-add-to-cart-clone="' + clone_id + '"]'));
                }

                $button.each(function () {
                    var $this = $(this);

                    $this.css({
                        'min-width': $this.outerWidth() + 'px'
                    });
                });

                $button.removeAttr('disabled').attr('data-button-status', 'added');

                setTimeout(function() {
                    $button.removeAttr('data-button-status').removeClass('active').removeAttr('style');
                }, 2000);

                _.updateValues(null, function() {
                    if(!limit_is_exceeded && current_variant) {
                        theme.Popups.callByName('cart');
                    }
                });
            };

            $body.on('click', this.selectors.button_add, function(e) {
                var $this = $(this);

                if(!$this.hasClass('active') && $this.attr('data-button-status') !== 'added') {
                    $this.addClass('active').attr('disabled', 'disabled');

                    var $form = $this.parents('form'),
                        form_serialize_array = $.extend({}, $form.serializeArray()),
                        form_data_object = {},
                        inner_namespace,
                        inner_prop;

                    $.each(form_serialize_array, function() {
                        if(this.name.indexOf('[') != -1 && this.name.indexOf(']') != -1) {
                            inner_namespace = this.name.split('[')[0];
                            inner_prop = this.name.split('[')[1].split(']')[0];
                            form_data_object[inner_namespace] = {};
                            form_data_object[inner_namespace][inner_prop] = this.value;
                        } else {
                            form_data_object[this.name] = this.value;
                        }
                    });

                    callback($this);

                    e.preventDefault();
                    return false;
                }
            });

            $body.on('click', this.selectors.button_remove, function(e) {
                var $this = $(this),
                    $product = $this.parents('[data-js-product]'),
                    id = +$product.attr('data-product-variant-id');

                Shopify.removeItem(id, function(data) {
                    _.updateValues(data);

                    if(!theme.Popups.getByName('cart').hasClass('d-none-important')) {
                        theme.PopupCart.update();
                    }
                });

                e.preventDefault();
                return false;
            });
        },
        updateValues: function(data, callback) {
            var _ = this;

            function process(data) {
                _.updateHeaderCount(data);
                _.updateFreeShipping(data);
            };

            if(data) {
                process(data);
            } else {
                Shopify.getCart(function(data) {
                    process(data);

                    if(callback && typeof callback === 'function') {
                        callback(data);
                    }
                });
            }
        },
        updateHeaderCount: function(data) {
            $('[data-js-cart-count-mobile]').attr('data-js-cart-count-mobile', data.item_count).html(data.item_count);
            $('[data-js-cart-count-desktop]').attr('data-js-cart-count-desktop', data.item_count).html(theme.strings.header.cart_count_desktop.replace('{{ count }}', data.item_count));
        },
        updateFreeShipping: function(data) {
            var $free_shipping = $('.js-free-shipping'),
                $progress = $free_shipping.find('[data-js-progress]'),
                $text = $free_shipping.find('[data-js-text]'),
                value = +$free_shipping.attr('data-value'),
                total = +data.total_price,
                procent = Math.min(total / (value / 100), 100),
                money = Math.max(value - total, 0),
                text_html = money > 0 ? theme.strings.cart.general.free_shipping_html.replace('{{ value }}', Shopify.formatMoney(money, theme.moneyFormat)) : theme.strings.cart.general.free_shipping_complete;

            $progress.css({
                width: procent + '%'
            });

            $text.html(text_html);
        }
    });

    theme.Cart = new Cart;
};
theme.StoreLists = function() {

    function Engine(namespace, callback) {
        this.namespace = namespace;

        this.selectors = {
            button: '.js-store-lists-add-' + namespace,
            button_remove: '.js-store-lists-remove-' + namespace,
            button_clear: '.js-store-lists-clear-' + namespace,
            has_items: '[data-js-store-lists-has-items-' + namespace + ']',
            dhas_items: '[data-js-store-lists-dhas-items-' + namespace + ']'
        };

        if(theme.customer) {
            this.current_storage = namespace + '-customer-' + theme.customer_id;

            this.app_obj = {
                namespace: namespace,
                customerid: theme.customer_id,
                shop: theme.permanent_domain,
                domain: theme.host,
                iid: theme.lists_app.iid
            };
        } else {
            this.current_storage = namespace + '-guest';
        }

        this.load(callback);
    };

    Engine.prototype = $.extend({}, Engine.prototype, {
        load: function(callback) {
            var _ = this;

            if(theme.customer) {
                var customer_storage = localStorage.getItem(this.current_storage),
                    customer_items = customer_storage ? JSON.parse(customer_storage) : [],
                    guest_storage = localStorage.getItem(this.namespace + '-guest'),
                    guest_items = guest_storage ? JSON.parse(guest_storage) : [],
                    sort_db_obj = {},
                    sort_new_obj = {},
                    items_new_array = [],
                    items_new_json;

                var sortObject = function(obj) {
                    return obj;
                    //return Object.keys(obj).sort().reduce((p, c) => (p[c] = obj[c], p), {});
                };

                var loadData = function() {
                    _.getCustomerList(function (data) {
                        if(data.status !== 200) return;

                        var i = 0;

                        if(data.items && data.items.length) {
                            customer_items = customer_items.concat(data.items);

                            for(; i < data.items.length; i++) {
                                $.each(data.items[i], function (k, v) {
                                    sort_db_obj[k] = v;
                                });
                            }

                            sort_db_obj = sortObject(sort_db_obj);
                        }

                        for(i = 0; i < customer_items.length; i++) {
                            $.each(customer_items[i], function (k, v) {
                                sort_new_obj[k] = v;
                            });
                        }

                        sort_new_obj = sortObject(sort_new_obj);

                        $.each(sort_new_obj, function (k, v) {
                            var obj = {};

                            obj[k] = v;
                            items_new_array.push(obj);
                        });

                        items_new_json = JSON.stringify(items_new_array);

                        if(JSON.stringify(sort_db_obj) !== JSON.stringify(sort_new_obj)) {
                            localStorage.setItem(_.current_storage, items_new_json);

                            _.setCustomerList(items_new_json);
                        }

                        _.updateHeaderCount();
                        _.checkProductStatus();

                        localStorage.removeItem(_.namespace + '-guest');
                    });
                };

                if(guest_items.length) {
                    callback({
                        trigger: function (is_active) {
                            if(is_active) customer_items = customer_items.concat(guest_items);

                            loadData();
                        },
                        info: {
                            namespace: _.namespace,
                            count: guest_items.length
                        }
                    });
                } else {
                    loadData();
                }
            } else {
                this.checkProductStatus();
            }

            $body.on('click', this.selectors.button, function(e) {
                e.preventDefault();

                var $this = $(this);

                $this.attr('disabled', 'disabled');

                var $product = $this.parents('[data-js-product]'),
                    handle = $product.attr('data-product-handle'),
                    id = +$product.attr('data-product-variant-id');

                if($this.attr('data-button-status') === 'added') {
                    _.removeItem(id, handle, function(data) {
                        $this.removeAttr('data-button-status');
                        $this.removeAttr('disabled');
                    });
                } else {
                    _.addItem(id, handle, function(data) {
                        $this.attr('data-button-status', 'added');
                        $this.removeAttr('disabled');
                    });
                }

                e.preventDefault();
                return false;
            });

            function removeCallback($product, handle) {
                var find = '[data-js-store-lists-product-' + _.namespace + ']',
                    $popup = theme.Popups.getByName(_.namespace);

                if(handle) find += '[data-product-handle="' + handle + '"]';

                $(find).each(function () {
                    var $this = $(this);

                    $($this.parent('[class*="col"]').length ? $this.parent() : $this).remove();
                });

                if($product && typeof $product !== undefined && $product.length) $product.remove();

                if(!$popup.hasClass('d-none-important')) {
                    theme.StoreLists.popups[_.namespace].update($popup);
                }
            };

            $body.on('click', this.selectors.button_remove, function() {
                var $this = $(this),
                    $product = $this.parents('[data-js-product]'),
                    handle = $product.attr('data-product-handle'),
                    id = +$product.attr('data-product-variant-id');

                _.removeItem(id, handle, function() {
                    removeCallback($product, handle);
                });
            });

            $body.on('click', this.selectors.button_clear, function() {
                _.clear(function() {
                    removeCallback();
                });
            });
        },
        setCustomerList: function(items, callback) {

        },
        getCustomerList: function(callback) {

        },
        addCustomerItem: function(id, handle, callback) {

        },
        removeCustomerItem: function(id, callback) {

        },
        clearCustomerItem: function(callback) {

        },
        addItem: function(id, handle, callback) {
            var storage = localStorage.getItem(this.current_storage),
                items = storage ? JSON.parse(storage) : [],
                obj = {};

            obj[id] = handle;

            items.push(obj);

            localStorage.setItem(this.current_storage, JSON.stringify(items));

            this.checkProductStatus();
            this.updateHeaderCount();

            this.addCustomerItem(id, handle);

            if(callback) callback();
        },
        removeItem: function(id, handle, callback) {
            var storage = localStorage.getItem(this.current_storage),
                items = storage ? JSON.parse(storage) : [];

            $.each(items, function (i) {
                if(this[id] && this[id] === handle) {
                    items.splice(i, 1);
                    return false;
                }
            });

            localStorage.setItem(this.current_storage, JSON.stringify(items));

            this.checkProductStatus();

            $(this.selectors.has_items)[items.length > 0 ? 'removeClass' : 'addClass']('d-none-important');
            $(this.selectors.dhas_items)[items.length > 0 ? 'addClass' : 'removeClass']('d-none-important');

            this.updateHeaderCount();

            this.removeCustomerItem(id);

            if (callback) callback();
        },
        clear: function (callback) {
            localStorage.removeItem(this.current_storage);

            this.checkProductStatus();

            $(this.selectors.has_items).addClass('d-none-important');
            $(this.selectors.dhas_items).removeClass('d-none-important');

            this.updateHeaderCount();

            this.clearCustomerItem();

            if (callback) callback();
        },
        checkProductStatus: function($products) {
            $products = $products || $('[data-js-product]');

            var _ = this,
                storage = localStorage.getItem(this.current_storage),
                items = storage ? JSON.parse(storage) : [],
                $active_products = $();

            $.each(items, function () {
                $.each(this, function (k, v) {
                    var $selected_product = $products.filter('[data-product-handle="' + v + '"][data-product-variant-id="' + k + '"]');

                    if ($selected_product.length) {
                        $active_products = $active_products.add($selected_product);
                    }
                });
            });

            $products.not($active_products).find(_.selectors.button).removeAttr('data-button-status');
            $active_products.find(_.selectors.button).attr('data-button-status', 'added');
        },
        updateHeaderCount: function(callback) {
            var storage = localStorage.getItem(this.current_storage),
                count = storage ? JSON.parse(storage).length : 0;

            $('[data-js-' + this.namespace + '-count]').attr('data-js-' + this.namespace + '-count', count).html(count);

            if (callback) callback();
        }
    });

    function Popup(namespace) {
        this.namespace = namespace;

        this.load();
    };

    Popup.prototype = $.extend({}, Popup.prototype, {
        load: function() {
            var _ = this;

            theme.Popups.addHandler(this.namespace, 'call.visible', function($popup) {
                _.update($popup, function () {
                    $popup.trigger('contentloaded');
                });
            });

            theme.Popups.addHandler(this.namespace + '-full', 'call.visible', function($popup) {
                _.updateFull($popup, function () {
                    $popup.trigger('contentloaded');
                });
            });
        },
        _resultToHTML: function($items, data, callback) {
            if(callback) {
                callback();
            }
        },
        _getProducts: function(wishlist, callback) {
            var _ = this,
                handles = [];

            if (this.xhr) this.xhr.abort();

            for(var i = 0; i < wishlist.length; i++) {
                $.each(wishlist[i], function () {
                    handles.push(this)
                });
            }

            handles = handles.join('+');

            callback({
                params: wishlist
            });
        },
        update: function($popup, callback) {
            var _ = this,
                storage = localStorage.getItem(theme.StoreLists.lists[this.namespace].current_storage),
                items = storage ? JSON.parse(storage) : [1, 2, 3, 4],
                $content = $popup.find('.popup-' + this.namespace + '__content'),
                $empty = $popup.find('.popup-' + this.namespace + '__empty'),
                $items = $popup.find('.popup-' + this.namespace + '__items'),
                $count = $popup.find('[data-js-popup-' + this.namespace + '-count]');

            $count.html(theme.strings.general.popups[this.namespace].count.replace('{{ count }}', items.length));
            $content[items.length > 0 ? 'removeClass' : 'addClass']('d-none-important');
            $empty[items.length > 0 ? 'addClass' : 'removeClass']('d-none-important');

            if(callback) {
                callback();
            }
        },
        updateFull: function ($popup, callback) {
            var _ = this,
                $content = $popup.find('.popup-' + this.namespace + '-full__content');

            theme.ImagesLazyLoad.update();
            theme.ProductCurrency.update();

            if(callback) {
                callback();
            }
        }
    });


    function StoreLists() {
        this.namespaces = [
            'wishlist',
            'compare'
        ];

        this.load();
    };

    StoreLists.prototype = $.extend({}, StoreLists.prototype, {
        lists: {},
        popups: {},
        load: function () {
            var triggers_array = [];

            for(var i = 0; i < this.namespaces.length; i++) {
                this.lists[this.namespaces[i]] = new Engine(this.namespaces[i], function (obj) {
                    triggers_array.push(obj);
                });
                this.popups[this.namespaces[i]] = new Popup(this.namespaces[i]);
            }

            if(triggers_array.length) {
                var $button_confirm = $('[data-js-button-transfer-data]');

                $button_confirm.one('click', function () {
                    $button_confirm.attr('data-js-active', true);
                    theme.Popups.closeByName('confirm-transfer-data');
                });

                theme.Popups.addHandler('confirm-transfer-data', 'close.after', function() {
                    $button_confirm.off();

                    for(var i = 0; i < triggers_array.length; i++) {
                        triggers_array[i].trigger($button_confirm.attr('data-js-active') === 'true');
                    }
                });

                var $info = $('[data-js-transfer-data-info]');

                for(var i = 0; i < triggers_array.length; i++) {
                    var $li = $('<li>'),
                        html = theme.strings.general.popups.confirm_transfer_data.info,
                        title;

                    switch(triggers_array[i].info.namespace) {
                        case 'wishlist':
                            title = theme.strings.general.popups.confirm_transfer_data.wishlist_title;
                            break;
                        case 'compare':
                            title = theme.strings.general.popups.confirm_transfer_data.compare_title;
                            break;
                    }

                    html = html.replace('{{ title }}', title);
                    html = html.replace('{{ count }}', triggers_array[i].info.count);
                    html = html.replace('{{ name }}', triggers_array[i].info.count > 1 ? theme.strings.general.popups.confirm_transfer_data.name_plural : theme.strings.general.popups.confirm_transfer_data.name_single);

                    $li.html(html);

                    $info.append($li);
                }

                theme.Popups.callByName('confirm-transfer-data');
            }
        },
        checkProductStatus: function () {
            $.each(this.lists, function () {
                this.checkProductStatus();
            });
        },
        updateHeaderCount: function () {
            $.each(this.lists, function () {
                this.updateHeaderCount();
            });
        }
    });

    theme.StoreLists = new StoreLists;
};
theme.Menu = function() {

    function Menu() {
        this.settings = {
            popup_name: 'navigation',
            button_navigation: 'data-js-popup-navigation-button'
        };

        this.selectors = {
            popup_navigation: '.js-popup-navigation'
        }
    };

    Menu.prototype = $.extend({}, Menu.prototype, {
        is_open_animate: false,
        duration: function () {
            return window.theme.animations.menu.duration > 0.1 ? (window.theme.animations.menu.duration - 0.1) * 1000 : 0;
        },
        init: function($menu, params) {
            var _ = this,
                $panel = $menu.find('.menu__panel'),
                $megamenus = $panel.find('.menu__megamenu'),
                $dropdowns = $panel.find('.menu__dropdown'),
                $popup_navigation = $(this.selectors.popup_navigation),
                $button_navigation = $popup_navigation.find('[' + this.settings.button_navigation + ']'),
                $curtain = $menu.find('.menu__curtain');

            this.$menu = $menu;
            this.$panel = $panel;
            this.$megamenus = $megamenus;
            this.$dropdowns = $dropdowns;
            this.$curtain = $curtain;

            this.handlerMenu = theme.Global.responsiveHandler({
                namespace: params.namespace,
                element: $menu,
                delegate: 'a',
                on_mobile: true,
                events: {
                    'click': function(e) {
                        var $this = $(this),
                            $item = $this.parent(),
                            $list = $item.find('.menu__list').first();

                        $panel.unbind('transitionend');

                        if($list.length) {
                            var level = $item.parents('.menu__level-02').length ? 3 : 2;

                            $item.addClass('open');

                            $item.find('.menu__list').first().addClass('show');

                            $panel.attr('data-mobile-level', level);

                            if($menu.length) {
                                $menu.scrollTop(0);
                            }

                            $button_navigation.attr(_.settings.button_navigation, 'back');

                            e.preventDefault();
                            return false;
                        }
                    }
                }
            });

            this.handlerBack = theme.Global.responsiveHandler({
                namespace: params.namespace,
                element: $popup_navigation,
                delegate: '[' + this.settings.button_navigation + '="back"]',
                on_mobile: true,
                events: {
                    'click': function() {
                        var level = $panel.attr('data-mobile-level') - 1,
                            button_status = level > 1 ? 'back' : 'close';

                        var $item = $menu.find('.menu__item.open').last();

                        $item.removeClass('open');

                        $panel.one('transitionend', function () {
                            $item.find('.menu__list').first().removeClass('show');
                        });

                        $panel.attr('data-mobile-level', level);

                        $menu.scrollTop(0);

                        $button_navigation.attr(_.settings.button_navigation, button_status);

                        if($panel.css('transition-duration') === '0s') {
                            $panel.trigger('transitionend');
                        }
                    }
                }
            });

            theme.Popups.addHandler(this.settings.popup_name, 'close.before.closeMobileMenu', function() {
                if(theme.current.is_mobile) {
                    _.closeMobileMenu();

                    $button_navigation.attr(_.settings.button_navigation, 'close');
                }
            });

            this.handlerDropdown = theme.Global.responsiveHandler({
                namespace: params.namespace,
                element: $panel,
                delegate: '> .menu__item',
                on_desktop: true,
                events: {
                    'mouseenter mouseleave': function(e) {
                        _._toggleMegamenu($(this), e);
                    }
                }
            });

            return {
                destroy: function() {
                    theme.Popups.removeHandler(_.settings.popup_name, 'close.before.closeMobileMenu');
                    _.handlerMenu.unbind();
                    _.handlerBack.unbind();
                    _.handlerDropdown.unbind();
                }
            }
        },
        _toggleMegamenu: function ($item, e) {
            var _ = this,
                $megamenu = $item.find('.menu__megamenu'),
                $dropdown = $item.find('.menu__dropdown');

            if(e.type === 'mouseenter') {
                if($megamenu.length) {
                    this.is_open_animate = true;

                    $megamenu.velocity('stop', true);
                    this.$dropdowns.velocity('finish');

                    this.$megamenus.not($megamenu).removeClass('show animate visible').removeAttr('style');
                    this.$dropdowns.removeClass('show animate visible').removeAttr('style');

                    $megamenu.addClass('show overflow-hidden');

                    var max_height = theme.current.height - $megamenu[0].getBoundingClientRect().top,
                        height = Math.min($megamenu.children().innerHeight(), max_height);

                    $megamenu.css({
                        'max-height': max_height
                    });

                    this.$curtain.velocity({
                        height: height,
                        tween: [height, this.$curtain.height()]
                    }, {

                        duration: this.duration(),
                        begin: function () {
                            _.$curtain.addClass('show');
                            $megamenu.addClass('animate visible');
                        },
                        progress: function (elements, c, r, s, t) {
                            $megamenu.height(t);
                        },
                        complete: function () {
                            $megamenu.removeClass('overflow-hidden').removeAttr('style');

                            _.is_open_animate = false;
                        }
                    });
                } else if($dropdown.length) {
                    $dropdown.addClass('show');

                    $dropdown.velocity('stop', true);
                    this.$megamenus.velocity('finish');

                    this.$dropdowns.not($dropdown).removeClass('show animate visible').removeAttr('style');
                    this.$megamenus.removeClass('show animate visible').removeAttr('style');

                    $dropdown.velocity('slideDown', {
                        duration: this.duration(),
                        begin: function () {
                            setTimeout(function () {
                                $dropdown.addClass('animate visible');
                            }, 0);
                        },
                        complete: function () {
                            $dropdown.removeAttr('style');
                        }
                    });
                }
            } else if(e.type === 'mouseleave') {
                if($megamenu.length && $megamenu.hasClass('show')) {
                    this.$curtain.velocity('stop');

                    $megamenu.velocity({
                        height: 0,
                        tween: [0, $megamenu.height()]
                    }, {
                        duration: this.duration(),
                        begin: function () {
                            $megamenu.addClass('overflow-hidden').removeClass('visible');
                        },
                        progress: function (elements, c, r, s, t) {
                            _.$curtain.height(t);
                        },
                        complete: function () {
                            $megamenu.removeClass('show animate overflow-hidden').removeAttr('style');

                            if(!_.is_open_animate) {
                                _.$curtain.removeClass('show').removeAttr('style');
                            }
                        }
                    });
                } else if($dropdown.length) {
                    $dropdown.velocity('slideUp', {
                        duration: this.duration(),
                        begin: function () {
                            $dropdown.removeClass('visible');
                        },
                        complete: function () {
                            $dropdown.removeClass('show animate').removeAttr('style');
                        }
                    });
                }
            }
        },
        closeMobileMenu: function() {
            if(theme.current.is_mobile) {
                var $panel = this.$menu.find('.menu__panel');

                $panel.find('.menu__item').removeClass('open');

                $panel.attr('data-mobile-level', '1');

                this.$menu.scrollTop(0);
            }
        }
    });

    theme.Menu = new Menu;
};
theme.Accordion = function () {

    function Accordion() {
        this.settings = {
            elements: 'data-js-accordion',
            button: 'data-js-accordion-button',
            duration: function () {
                return theme.animations.accordion.duration * 1000;
            }
        };

        this.selectors = {
            elements: '[' + this.settings.elements + ']',
            button: '[' + this.settings.button + ']',
            content: '[data-js-accordion-content]',
            input: '[data-js-accordion-input]'
        };

        this.load();
    };

    Accordion.prototype = $.extend({}, Accordion.prototype, {
        load: function () {
            var _ = this;

            function toggle(e) {
                var $this = $(this),
                    $input = $this.find(_.selectors.input),
                    $sticky = $('.js-sticky-sidebar');

                if ($input.length) {
                    if (e.target.tagName === 'INPUT') {
                        return;
                    } else if ($.contains($this.find('label')[0], e.target) && !$input.prop('checked') && $this.hasClass('open')) {
                        return;
                    }
                }

                var $element = $this.parents(_.selectors.elements).first(),
                    $content = $element.find(_.selectors.content).first();

                if ($content.is(':animated')) {
                    return;
                }

                $this.toggleClass('open');

                if ($this.hasClass('open')) {
                    $content.hide().removeClass('d-none').slideDown({
                        duration: _.settings.duration(),
                        step: function () {
                            if (theme.StickySidebar) {
                                theme.StickySidebar.update($sticky);
                            }
                        },
                        complete: function () {
                            $content.removeAttr('style');

                            if (theme.StickySidebar) {
                                theme.StickySidebar.update($sticky);
                            }
                        }
                    });
                } else {
                    $content.slideUp({
                        duration: _.settings.duration(),
                        step: function () {
                            if (theme.StickySidebar) {
                                theme.StickySidebar.update($sticky);
                            }
                        },
                        complete: function () {
                            $content.addClass('d-none').removeAttr('style');

                            if (theme.StickySidebar) {
                                theme.StickySidebar.update($sticky);
                            }
                        }
                    });
                }

                $element.find(_.selectors.button)
                    .not($this)
                    .not($element.find(_.selectors.content).find(_.selectors.button))
                    .add($element.find('[' + _.settings.button + '="inner"]'))
                    [$this.hasClass('open') ? 'addClass' : 'removeClass']('open');
            };

            $body.on('click', '[' + this.settings.elements + '="all"] ' + this.selectors.button, toggle);

            theme.Global.responsiveHandler({
                namespace: '.accordion',
                element: $body,
                delegate: '[' + this.settings.elements + '="only-mobile"] ' + this.selectors.button,
                on_mobile: true,
                events: {
                    'click': toggle
                }
            });
        }
    });

    theme.Accordion = new Accordion;
};

var Section = {};

Section.prototype = $.extend({}, Section.prototype, {
    _registerHansler: function() {
        if(!this.elemsHasHandler) {
            this.elemsHasHandler = [];
        }

        for (var i = 0; i < arguments.length; i++) {
            this.elemsHasHandler.push(arguments[i]);
        }
    },
    _offHanslers: function() {
        if(this.elemsHasHandler && $.isArray(this.elemsHasHandler)) {
            for (var i = 0; i < this.elemsHasHandler.length; i++) {
                $(this.elemsHasHandler[i]).off();
            }

            delete this.elemsHasHandler;
        }
    }
});

var Currency = {
    convertAll: function (argumants) {
        return argumants;
    },
    convert: function (argumants) {
        return argumants;
    },
    moneyFormats: function (argumants) {
        return argumants;
    }
}

$(function() {
    theme.Global();
    theme.ProductCurrency();
    theme.ImagesLazyLoad();
    theme.Position();
    theme.Menu();
    theme.Dropdown();
    theme.Select();
    theme.Loader();
    theme.Popups();
    theme.PopupAccount();
    theme.PopupSearch();
    theme.PopupCart();
    theme.PopupQuickView();
    theme.ProductQuantity();
    theme.ProductCountdown();
    theme.ProductTextCountdown();
    theme.ProductVisitors();
    theme.ProductImagesNavigation();
    theme.ProductImagesHover();
    theme.ProductOptions();
    theme.ProductReview();
    theme.ProductGallery();
    theme.Cart();
    theme.StoreLists();
    theme.Accordion();

    theme.sections = {
        register: function (type, Constructor) {
            var $section = $('[data-section-type="' + type + '"]');

            $section.each(function () {
                new Constructor($(this));
            });
        }
    };
});