(function () {
    const SCRIPT_ID = 'umami-analytics-script';
    const pendingEvents = [];
    let retryTimer = null;

    function getConfig() {
        return window.__UMAMI_CONFIG || {};
    }

    function initUmami() {
        const config = getConfig();
        if (!config.enabled || !config.scriptSrc || !config.websiteId) {
            return;
        }

        if (document.getElementById(SCRIPT_ID)) {
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = config.scriptSrc;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-website-id', config.websiteId);
        script.addEventListener('load', flushPendingEvents);
        document.head.appendChild(script);
    }

    function isTrackingConfigured() {
        const config = getConfig();
        return Boolean(config.enabled && config.scriptSrc && config.websiteId);
    }

    function canTrack() {
        return typeof window.umami !== 'undefined' && typeof window.umami.track === 'function';
    }

    function flushPendingEvents() {
        if (!canTrack()) {
            return;
        }

        while (pendingEvents.length > 0) {
            const item = pendingEvents.shift();
            window.umami.track(item.name, item.props);
        }
    }

    function scheduleRetry() {
        if (retryTimer) {
            return;
        }

        retryTimer = setInterval(function () {
            if (!pendingEvents.length) {
                clearInterval(retryTimer);
                retryTimer = null;
                return;
            }

            flushPendingEvents();
        }, 1000);
    }

    function trackEvent(eventName, properties) {
        if (!eventName || typeof eventName !== 'string') {
            return;
        }

        if (!isTrackingConfigured()) {
            return;
        }

        if (canTrack()) {
            window.umami.track(eventName, properties || {});
            return;
        }

        if (pendingEvents.length >= 50) {
            pendingEvents.shift();
        }
        pendingEvents.push({ name: eventName, props: properties || {} });
        scheduleRetry();
    }

    function parseProps(raw) {
        if (!raw) {
            return {};
        }

        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            console.warn('Invalid data-umami-props JSON:', error);
            return {};
        }
    }

    function bindAutoTracking() {
        document.addEventListener('click', function (event) {
            const target = event.target.closest('[data-umami-event]');
            if (!target) {
                return;
            }

            const eventName = target.getAttribute('data-umami-event');
            const props = parseProps(target.getAttribute('data-umami-props'));
            trackEvent(eventName, props);
        });
    }

    window.trackEvent = trackEvent;

    document.addEventListener('DOMContentLoaded', function () {
        initUmami();
        bindAutoTracking();
        flushPendingEvents();
    });
})();
