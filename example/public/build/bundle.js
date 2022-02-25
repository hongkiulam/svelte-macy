var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var macy = {exports: {}};

    (function (module, exports) {
    !function(t,n){module.exports=n();}(commonjsGlobal,function(){function t(t,n){var e=void 0;return function(){e&&clearTimeout(e),e=setTimeout(t,n);}}function n(t,n){for(var e=t.length,r=e,o=[];e--;)o.push(n(t[r-e-1]));return o}function e(t,n){var e=arguments.length>2&&void 0!==arguments[2]&&arguments[2];if(window.Promise)return A(t,n,e);t.recalculate(!0,!0);}function r(t){for(var n=t.options,e=t.responsiveOptions,r=t.keys,o=t.docWidth,i=void 0,s=0;s<r.length;s++){var a=parseInt(r[s],10);o>=a&&(i=n.breakAt[a],O(i,e));}return e}function o(t){for(var n=t.options,e=t.responsiveOptions,r=t.keys,o=t.docWidth,i=void 0,s=r.length-1;s>=0;s--){var a=parseInt(r[s],10);o<=a&&(i=n.breakAt[a],O(i,e));}return e}function i(t){var n=t.useContainerForBreakpoints?t.container.clientWidth:window.innerWidth,e={columns:t.columns};b(t.margin)?e.margin={x:t.margin.x,y:t.margin.y}:e.margin={x:t.margin,y:t.margin};var i=Object.keys(t.breakAt);return t.mobileFirst?r({options:t,responsiveOptions:e,keys:i,docWidth:n}):o({options:t,responsiveOptions:e,keys:i,docWidth:n})}function s(t){return i(t).columns}function a(t){return i(t).margin}function c(t){var n=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],e=s(t),r=a(t).x,o=100/e;if(!n)return o;if(1===e)return "100%";var i="px";if("string"==typeof r){var c=parseFloat(r);i=r.replace(c,""),r=c;}return r=(e-1)*r/e,"%"===i?o-r+"%":"calc("+o+"% - "+r+i+")"}function u(t,n){var e=s(t.options),r=0,o=void 0,i=void 0;if(1===++n)return 0;i=a(t.options).x;var u="px";if("string"==typeof i){var l=parseFloat(i,10);u=i.replace(l,""),i=l;}return o=(i-(e-1)*i/e)*(n-1),r+=c(t.options,!1)*(n-1),"%"===u?r+o+"%":"calc("+r+"% + "+o+u+")"}function l(t){var n=0,e=t.container,r=t.rows;v(r,function(t){n=t>n?t:n;}),e.style.height=n+"px";}function p(t,n){var e=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=!(arguments.length>3&&void 0!==arguments[3])||arguments[3],o=s(t.options),i=a(t.options).y;M(t,o,e),v(n,function(n){var e=0,o=parseInt(n.offsetHeight,10);isNaN(o)||(t.rows.forEach(function(n,r){n<t.rows[e]&&(e=r);}),n.style.position="absolute",n.style.top=t.rows[e]+"px",n.style.left=""+t.cols[e],t.rows[e]+=isNaN(o)?0:o+i,r&&(n.dataset.macyComplete=1));}),r&&(t.tmpRows=null),l(t);}function f(t,n){var e=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=!(arguments.length>3&&void 0!==arguments[3])||arguments[3],o=s(t.options),i=a(t.options).y;M(t,o,e),v(n,function(n){t.lastcol===o&&(t.lastcol=0);var e=C(n,"height");e=parseInt(n.offsetHeight,10),isNaN(e)||(n.style.position="absolute",n.style.top=t.rows[t.lastcol]+"px",n.style.left=""+t.cols[t.lastcol],t.rows[t.lastcol]+=isNaN(e)?0:e+i,t.lastcol+=1,r&&(n.dataset.macyComplete=1));}),r&&(t.tmpRows=null),l(t);}var h=function t(n,e){if(!(this instanceof t))return new t(n,e);if(n&&n.nodeName)return n;if(n=n.replace(/^\s*/,"").replace(/\s*$/,""),e)return this.byCss(n,e);for(var r in this.selectors)if(e=r.split("/"),new RegExp(e[1],e[2]).test(n))return this.selectors[r](n);return this.byCss(n)};h.prototype.byCss=function(t,n){return (n||document).querySelectorAll(t)},h.prototype.selectors={},h.prototype.selectors[/^\.[\w\-]+$/]=function(t){return document.getElementsByClassName(t.substring(1))},h.prototype.selectors[/^\w+$/]=function(t){return document.getElementsByTagName(t)},h.prototype.selectors[/^\#[\w\-]+$/]=function(t){return document.getElementById(t.substring(1))};var v=function(t,n){for(var e=t.length,r=e;e--;)n(t[r-e-1]);},m=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.running=!1,this.events=[],this.add(t);};m.prototype.run=function(){if(!this.running&&this.events.length>0){var t=this.events.shift();this.running=!0,t(),this.running=!1,this.run();}},m.prototype.add=function(){var t=this,n=arguments.length>0&&void 0!==arguments[0]&&arguments[0];return !!n&&(Array.isArray(n)?v(n,function(n){return t.add(n)}):(this.events.push(n),void this.run()))},m.prototype.clear=function(){this.events=[];};var d=function(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return this.instance=t,this.data=n,this},y=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.events={},this.instance=t;};y.prototype.on=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],n=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return !(!t||!n)&&(Array.isArray(this.events[t])||(this.events[t]=[]),this.events[t].push(n))},y.prototype.emit=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(!t||!Array.isArray(this.events[t]))return !1;var e=new d(this.instance,n);v(this.events[t],function(t){return t(e)});};var g=function(t){return !("naturalHeight"in t&&t.naturalHeight+t.naturalWidth===0)||t.width+t.height!==0},E=function(t,n){var e=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return new Promise(function(t,e){if(n.complete)return g(n)?t(n):e(n);n.addEventListener("load",function(){return g(n)?t(n):e(n)}),n.addEventListener("error",function(){return e(n)});}).then(function(n){e&&t.emit(t.constants.EVENT_IMAGE_LOAD,{img:n});}).catch(function(n){return t.emit(t.constants.EVENT_IMAGE_ERROR,{img:n})})},w=function(t,e){var r=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return n(e,function(n){return E(t,n,r)})},A=function(t,n){var e=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return Promise.all(w(t,n,e)).then(function(){t.emit(t.constants.EVENT_IMAGE_COMPLETE);})},I=function(n){return t(function(){n.emit(n.constants.EVENT_RESIZE),n.queue.add(function(){return n.recalculate(!0,!0)});},100)},N=function(t){if(t.container=h(t.options.container),t.container instanceof h||!t.container)return !!t.options.debug&&console.error("Error: Container not found");t.container.length&&(t.container=t.container[0]),t.options.container=t.container,t.container.style.position="relative";},T=function(t){t.queue=new m,t.events=new y(t),t.rows=[],t.resizer=I(t);},L=function(t){var n=h("img",t.container);window.addEventListener("resize",t.resizer),t.on(t.constants.EVENT_IMAGE_LOAD,function(){return t.recalculate(!1,!1)}),t.on(t.constants.EVENT_IMAGE_COMPLETE,function(){return t.recalculate(!0,!0)}),t.options.useOwnImageLoader||e(t,n,!t.options.waitForImages),t.emit(t.constants.EVENT_INITIALIZED);},_=function(t){N(t),T(t),L(t);},b=function(t){return t===Object(t)&&"[object Array]"!==Object.prototype.toString.call(t)},O=function(t,n){b(t)||(n.columns=t),b(t)&&t.columns&&(n.columns=t.columns),b(t)&&t.margin&&!b(t.margin)&&(n.margin={x:t.margin,y:t.margin}),b(t)&&t.margin&&b(t.margin)&&t.margin.x&&(n.margin.x=t.margin.x),b(t)&&t.margin&&b(t.margin)&&t.margin.y&&(n.margin.y=t.margin.y);},C=function(t,n){return window.getComputedStyle(t,null).getPropertyValue(n)},M=function(t,n){var e=arguments.length>2&&void 0!==arguments[2]&&arguments[2];if(t.lastcol||(t.lastcol=0),t.rows.length<1&&(e=!0),e){t.rows=[],t.cols=[],t.lastcol=0;for(var r=n-1;r>=0;r--)t.rows[r]=0,t.cols[r]=u(t,r);}else if(t.tmpRows){t.rows=[];for(var r=n-1;r>=0;r--)t.rows[r]=t.tmpRows[r];}else {t.tmpRows=[];for(var r=n-1;r>=0;r--)t.tmpRows[r]=t.rows[r];}},V=function(t){var n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],e=!(arguments.length>2&&void 0!==arguments[2])||arguments[2],r=n?t.container.children:h(':scope > *:not([data-macy-complete="1"])',t.container);r=Array.from(r).filter(function(t){return null!==t.offsetParent});var o=c(t.options);return v(r,function(t){n&&(t.dataset.macyComplete=0),t.style.width=o;}),t.options.trueOrder?(f(t,r,n,e),t.emit(t.constants.EVENT_RECALCULATED)):(p(t,r,n,e),t.emit(t.constants.EVENT_RECALCULATED))},R=function(){return !!window.Promise},x=Object.assign||function(t){for(var n=1;n<arguments.length;n++){var e=arguments[n];for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);}return t};Array.from||(Array.from=function(t){for(var n=0,e=[];n<t.length;)e.push(t[n++]);return e});var k={columns:4,margin:2,trueOrder:!1,waitForImages:!1,useImageLoader:!0,breakAt:{},useOwnImageLoader:!1,onInit:!1,cancelLegacy:!1,useContainerForBreakpoints:!1};!function(){try{document.createElement("a").querySelector(":scope *");}catch(t){!function(){function t(t){return function(e){if(e&&n.test(e)){var r=this.getAttribute("id");r||(this.id="q"+Math.floor(9e6*Math.random())+1e6),arguments[0]=e.replace(n,"#"+this.id);var o=t.apply(this,arguments);return null===r?this.removeAttribute("id"):r||(this.id=r),o}return t.apply(this,arguments)}}var n=/:scope\b/gi,e=t(Element.prototype.querySelector);Element.prototype.querySelector=function(t){return e.apply(this,arguments)};var r=t(Element.prototype.querySelectorAll);Element.prototype.querySelectorAll=function(t){return r.apply(this,arguments)};}();}}();var q=function t(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:k;if(!(this instanceof t))return new t(n);this.options={},x(this.options,k,n),this.options.cancelLegacy&&!R()||_(this);};return q.init=function(t){return console.warn("Depreciated: Macy.init will be removed in v3.0.0 opt to use Macy directly like so Macy({ /*options here*/ }) "),new q(t)},q.prototype.recalculateOnImageLoad=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];return e(this,h("img",this.container),!t)},q.prototype.runOnImageLoad=function(t){var n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],r=h("img",this.container);return this.on(this.constants.EVENT_IMAGE_COMPLETE,t),n&&this.on(this.constants.EVENT_IMAGE_LOAD,t),e(this,r,n)},q.prototype.recalculate=function(){var t=this,n=arguments.length>0&&void 0!==arguments[0]&&arguments[0],e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];return e&&this.queue.clear(),this.queue.add(function(){return V(t,n,e)})},q.prototype.remove=function(){window.removeEventListener("resize",this.resizer),v(this.container.children,function(t){t.removeAttribute("data-macy-complete"),t.removeAttribute("style");}),this.container.removeAttribute("style");},q.prototype.reInit=function(){this.recalculate(!0,!0),this.emit(this.constants.EVENT_INITIALIZED),window.addEventListener("resize",this.resizer),this.container.style.position="relative";},q.prototype.on=function(t,n){this.events.on(t,n);},q.prototype.emit=function(t,n){this.events.emit(t,n);},q.constants={EVENT_INITIALIZED:"macy.initialized",EVENT_RECALCULATED:"macy.recalculated",EVENT_IMAGE_LOAD:"macy.image.load",EVENT_IMAGE_ERROR:"macy.image.error",EVENT_IMAGE_COMPLETE:"macy.images.complete",EVENT_RESIZE:"macy.resize"},q.prototype.constants=q.constants,q});
    }(macy));

    var _Macy = macy.exports;

    /* src/Macy.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$1 = "src/Macy.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "id", "macy");
    			add_location(div, file$1, 21, 0, 562);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Macy", slots, ['default']);
    	
    	const Macy = _Macy;
    	let { options } = $$props;
    	let { macy = undefined } = $$props;
    	let mounted = false;

    	onMount(() => {
    		$$invalidate(0, macy = Macy(Object.assign({ container: "#macy" }, options)));
    		$$invalidate(2, mounted = true);
    	});

    	onDestroy(() => {
    		macy === null || macy === void 0
    		? void 0
    		: macy.remove();
    	});

    	const writable_props = ["options", "macy"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Macy> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("macy" in $$props) $$invalidate(0, macy = $$props.macy);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		_Macy,
    		Macy,
    		options,
    		macy,
    		mounted
    	});

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("macy" in $$props) $$invalidate(0, macy = $$props.macy);
    		if ("mounted" in $$props) $$invalidate(2, mounted = $$props.mounted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*mounted, macy, options*/ 7) {
    			// if options changes, recreate
    			if (mounted) {
    				macy === null || macy === void 0
    				? void 0
    				: macy.remove();

    				$$invalidate(0, macy = Macy(Object.assign({ container: "#macy" }, options)));
    			}
    		}
    	};

    	return [macy, options, mounted, $$scope, slots];
    }

    class Macy_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { options: 1, macy: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Macy_1",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*options*/ ctx[1] === undefined && !("options" in props)) {
    			console.warn("<Macy> was created without expected prop 'options'");
    		}
    	}

    	get options() {
    		throw new Error("<Macy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Macy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get macy() {
    		throw new Error("<Macy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set macy(value) {
    		throw new Error("<Macy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Object.assign({}, _Macy.constants);

    /* example/src/App.svelte generated by Svelte v3.38.2 */
    const file = "example/src/App.svelte";

    // (26:2) <Macy     bind:macy     options={{       columns: 6,       margin: 10,     }}   >
    function create_default_slot(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let t11;
    	let div6;
    	let t13;
    	let div7;
    	let t15;
    	let div8;
    	let t17;
    	let div9;
    	let t19;
    	let div10;
    	let t21;
    	let div11;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit maiores\n      voluptatibus dolore. Illo molestias placeat ex. Magni earum totam nihil\n      quod accusamus illum quaerat iste quidem officia! Illo, dolorem. Quae!";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid nam\n      mollitia esse consequuntur numquam corrupti animi illum, corporis earum\n      nulla modi fuga fugit facilis quo odit quam accusamus libero architecto\n      reiciendis laboriosam explicabo? Tempore id eos molestiae aspernatur hic\n      eveniet quibusdam! Beatae expedita debitis provident quod officiis, aut\n      quidem natus?";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Recusandae,\n      enim.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab quia quo nam\n      odit maxime minus ut nemo, doloribus eius beatae! Libero reprehenderit\n      provident similique expedita, esse autem veniam deleniti numquam molestias\n      nemo qui eaque at non tenetur magni sit. Blanditiis corporis hic soluta\n      facere aliquam temporibus id consequatur nihil voluptatum. Doloremque\n      nulla ipsa sunt eligendi tenetur maxime laudantium unde vel nobis corporis\n      corrupti dolor alias, molestiae eum enim reprehenderit! Sunt voluptas ea\n      quisquam rerum voluptatum, omnis ipsa quia at nulla. Ducimus eos deserunt\n      eligendi, consectetur provident molestias vel quo adipisci sit? Eligendi\n      sint similique praesentium repellendus. Sed dolore fuga assumenda.";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, deserunt\n      voluptatibus vero, nostrum dolor animi alias exercitationem delectus nemo\n      rem atque, praesentium eius earum distinctio consequatur consequuntur\n      eveniet id sit iusto quidem. Sunt.";
    			t9 = space();
    			div5 = element("div");
    			div5.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus nam\n      harum non quaerat, aliquam consequatur sint corrupti voluptates nobis, at\n      nesciunt ducimus. Voluptatum quod, officia itaque in vitae aliquam minus";
    			t11 = space();
    			div6 = element("div");
    			div6.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit maiores\n      voluptatibus dolore. Illo molestias placeat ex. Magni earum totam nihil\n      quod accusamus illum quaerat iste quidem officia! Illo, dolorem. Quae!";
    			t13 = space();
    			div7 = element("div");
    			div7.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid nam\n      mollitia esse consequuntur numquam corrupti animi illum, corporis earum\n      nulla modi fuga fugit facilis quo odit quam accusamus libero architecto\n      reiciendis laboriosam explicabo? Tempore id eos molestiae aspernatur hic\n      eveniet quibusdam! Beatae expedita debitis provident quod officiis, aut\n      quidem natus?";
    			t15 = space();
    			div8 = element("div");
    			div8.textContent = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Recusandae,\n      enim.";
    			t17 = space();
    			div9 = element("div");
    			div9.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab quia quo nam\n      odit maxime minus ut nemo, doloribus eius beatae! Libero reprehenderit\n      provident similique expedita, esse autem veniam deleniti numquam molestias\n      nemo qui eaque at non tenetur magni sit. Blanditiis corporis hic soluta\n      facere aliquam temporibus id consequatur nihil voluptatum. Doloremque\n      nulla ipsa sunt eligendi tenetur maxime laudantium unde vel nobis corporis\n      corrupti dolor alias, molestiae eum enim reprehenderit! Sunt voluptas ea\n      quisquam rerum voluptatum, omnis ipsa quia at nulla. Ducimus eos deserunt\n      eligendi, consectetur provident molestias vel quo adipisci sit? Eligendi\n      sint similique praesentium repellendus. Sed dolore fuga assumenda.";
    			t19 = space();
    			div10 = element("div");
    			div10.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, deserunt\n      voluptatibus vero, nostrum dolor animi alias exercitationem delectus nemo\n      rem atque, praesentium eius earum distinctio consequatur consequuntur\n      eveniet id sit iusto quidem. Sunt.";
    			t21 = space();
    			div11 = element("div");
    			div11.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus nam\n      harum non quaerat, aliquam consequatur sint corrupti voluptates nobis, at\n      nesciunt ducimus. Voluptatum quod, officia itaque in vitae aliquam minus";
    			attr_dev(div0, "class", "card svelte-1nphabw");
    			add_location(div0, file, 32, 4, 455);
    			attr_dev(div1, "class", "card svelte-1nphabw");
    			add_location(div1, file, 37, 4, 720);
    			attr_dev(div2, "class", "card svelte-1nphabw");
    			add_location(div2, file, 45, 4, 1162);
    			attr_dev(div3, "class", "card svelte-1nphabw");
    			add_location(div3, file, 49, 4, 1284);
    			attr_dev(div4, "class", "card svelte-1nphabw");
    			add_location(div4, file, 61, 4, 2102);
    			attr_dev(div5, "class", "card svelte-1nphabw");
    			add_location(div5, file, 67, 4, 2411);
    			attr_dev(div6, "class", "card svelte-1nphabw");
    			add_location(div6, file, 72, 4, 2680);
    			attr_dev(div7, "class", "card svelte-1nphabw");
    			add_location(div7, file, 77, 4, 2945);
    			attr_dev(div8, "class", "card svelte-1nphabw");
    			add_location(div8, file, 85, 4, 3387);
    			attr_dev(div9, "class", "card svelte-1nphabw");
    			add_location(div9, file, 89, 4, 3509);
    			attr_dev(div10, "class", "card svelte-1nphabw");
    			add_location(div10, file, 101, 4, 4327);
    			attr_dev(div11, "class", "card svelte-1nphabw");
    			add_location(div11, file, 107, 4, 4636);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div4, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div5, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div6, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div7, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div8, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div9, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div10, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, div11, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div11);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(26:2) <Macy     bind:macy     options={{       columns: 6,       margin: 10,     }}   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let macy_1;
    	let updating_macy;
    	let current;

    	function macy_1_macy_binding(value) {
    		/*macy_1_macy_binding*/ ctx[1](value);
    	}

    	let macy_1_props = {
    		options: { columns: 6, margin: 10 },
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*macy*/ ctx[0] !== void 0) {
    		macy_1_props.macy = /*macy*/ ctx[0];
    	}

    	macy_1 = new Macy_1({ props: macy_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(macy_1, "macy", macy_1_macy_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(macy_1.$$.fragment);
    			attr_dev(main, "class", "svelte-1nphabw");
    			add_location(main, file, 24, 0, 360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(macy_1, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const macy_1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				macy_1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_macy && dirty & /*macy*/ 1) {
    				updating_macy = true;
    				macy_1_changes.macy = /*macy*/ ctx[0];
    				add_flush_callback(() => updating_macy = false);
    			}

    			macy_1.$set(macy_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(macy_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(macy_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(macy_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	
    	let macy;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function macy_1_macy_binding(value) {
    		macy = value;
    		$$invalidate(0, macy);
    	}

    	$$self.$capture_state = () => ({ Macy: Macy_1, macy });

    	$$self.$inject_state = $$props => {
    		if ("macy" in $$props) $$invalidate(0, macy = $$props.macy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [macy, macy_1_macy_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
