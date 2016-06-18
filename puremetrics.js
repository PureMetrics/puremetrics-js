(function() {
    'use strict';

    var CONFIG = {
        PROTOCOL: ('https:' == document.location.protocol ? 'https://' : 'http://'),
        API: "api.puremetrics.io/v1/collect"
    }

    var toString = Object.prototype.toString;
    var userAgent = navigator.userAgent;
    var vendor = navigator.vendor;
    var opera = window.opera;
    var ACCOUNT_ID = '';
    
    var LIB_VERSION = 100;
    var DEBUG = false;
    var _ = {};

    (function() {

        _.includes = function(str, needle) {
            return str.indexOf(needle) !== -1;
        };

        // _.isBlockedUA()
        // This is to block various web spiders from executing our JS and
        // sending false tracking data
        _.isBlockedUA = function(ua) {
            if (/(google web preview|facebookexternalhit|baiduspider|yandexbot|bingbot|googlebot|yahoo! slurp)/i.test(ua)) {
                return true;
            }
            return false;
        };

        _.setCookie = function(cname, cvalue) {
            var d = new Date();
            d.setTime(d.getTime() + 31104000000);
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        };

        _.getCookie = function(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
        return void 0;
        };

        _.isUndefined = function(obj) {
            return obj === void 0;
        };

        _.generateUUID = function(){
            var d = new Date().getTime();
            if(window.performance && typeof window.performance.now === "function"){
                d += performance.now(); //use high-precision timer if available
            }
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x3|0x8)).toString(16);
            });
            return uuid;
        };

    }());

    //TODO get 
    //browser version, browser name, os
    //platform set to web
    //generate deviceId and store
    //generate anonymous_id and store
    //connection_type to be set to 'generic'
    //get timezone
    //get timestamp

    _.deviceInfo = {
        /**
         * This function detects which browser is running this script.
         * The order of the checks are important since many user agents
         * include key words used in later checks.
         */
        browser: function(user_agent, vendor, opera) {
            var vendor = vendor || ''; // vendor is undefined for at least IE9
            if (opera || _.includes(user_agent, " OPR/")) {
                if (_.includes(user_agent, "Mini")) {
                    return "Opera Mini";
                }
                return "Opera";
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
                return 'BlackBerry';
            } else if (_.includes(user_agent, "IEMobile") || _.includes(user_agent, "WPDesktop")) {
                return "Internet Explorer Mobile";
            } else if (_.includes(user_agent, "Edge")) {
                return "Microsoft Edge";
            } else if (_.includes(user_agent, "FBIOS")) {
                return "Facebook Mobile";
            } else if (_.includes(user_agent, "Chrome")) {
                return "Chrome";
            } else if (_.includes(user_agent, "CriOS")) {
                return "Chrome iOS";
            } else if (_.includes(user_agent, "FxiOS")) {
                return "Firefox iOS";
            } else if (_.includes(vendor, "Apple")) {
                if (_.includes(user_agent, "Mobile")) {
                    return "Mobile Safari";
                }
                return "Safari";
            } else if (_.includes(user_agent, "Android")) {
                return "Android Mobile";
            } else if (_.includes(user_agent, "Konqueror")) {
                return "Konqueror";
            } else if (_.includes(user_agent, "Firefox")) {
                return "Firefox";
            } else if (_.includes(user_agent, "MSIE") || _.includes(user_agent, "Trident/")) {
                return "Internet Explorer";
            } else if (_.includes(user_agent, "Gecko")) {
                return "Mozilla";
            } else {
                return "";
            }
        },
        /**
         * This function detects which browser version is running this script,
         * parsing major and minor version (e.g., 42.1). User agent strings from:
         * http://www.useragentstring.com/pages/useragentstring.php
         */
        browserVersion: function(userAgent, vendor, opera) {
            var browser = _.deviceInfo.browser(userAgent, vendor, opera);
            var versionRegexs = {
                "Internet Explorer Mobile": /rv:(\d+(\.\d+)?)/,
                "Microsoft Edge": /Edge\/(\d+(\.\d+)?)/,
                "Chrome": /Chrome\/(\d+(\.\d+)?)/,
                "Chrome iOS": /CriOS\/(\d+(\.\d+)?)/,
                "Safari": /Version\/(\d+(\.\d+)?)/,
                "Mobile Safari": /Version\/(\d+(\.\d+)?)/,
                "Opera": /(Opera|OPR)\/(\d+(\.\d+)?)/,
                "Firefox": /Firefox\/(\d+(\.\d+)?)/,
                "Firefox iOS": /FxiOS\/(\d+(\.\d+)?)/,
                "Konqueror": /Konqueror:(\d+(\.\d+)?)/,
                "BlackBerry": /BlackBerry (\d+(\.\d+)?)/,
                "Android Mobile": /android\s(\d+(\.\d+)?)/,
                "Internet Explorer": /(rv:|MSIE )(\d+(\.\d+)?)/,
                "Mozilla": /rv:(\d+(\.\d+)?)/
            };
            var regex = versionRegexs[browser];
            if (regex == undefined) {
                return null;
            }
            var matches = userAgent.match(regex);
            if (!matches) {
                return null;
            }
            return parseFloat(matches[matches.length - 2]);
        },

        os: function() {
            var a = userAgent;
            if (/Windows/i.test(a)) {
                if (/Phone/.test(a) || /WPDesktop/.test(a)) {
                    return 'Windows Phone';
                }
                return 'Windows';
            } else if (/(iPhone|iPad|iPod)/.test(a)) {
                return 'iOS';
            } else if (/Android/.test(a)) {
                return 'Android';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
                return 'BlackBerry';
            } else if (/Mac/i.test(a)) {
                return 'Mac OS X';
            } else if (/Linux/.test(a)) {
                return 'Linux';
            } else {
                return '';
            }
        },

        device: function(user_agent) {
            if (/Windows Phone/i.test(user_agent) || /WPDesktop/.test(user_agent)) {
                return 'Windows Phone';
            } else if (/iPad/.test(user_agent)) {
                return 'iPad';
            } else if (/iPod/.test(user_agent)) {
                return 'iPod Touch';
            } else if (/iPhone/.test(user_agent)) {
                return 'iPhone';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
                return 'BlackBerry';
            } else if (/Android/.test(user_agent)) {
                return 'Android';
            } else {
                return '';
            }
        }
    };

    /**
     * @constructor
     */
    function PureMetrics(){ }

    PureMetrics.prototype.push = function(){
         for (var i = 0; i < arguments.length; i++) {
                try {
                    if (typeof arguments[i] === "function") {
                        arguments[i]();
                    } else {
                        // get tracker function from arguments[i][0]
                        var functionName = arguments[i][0];
                        var args = arguments[i].slice(1);
                        // get tracker function arguments from arguments[i].slice(1)
                        this[functionName].apply(this, args);
                    }
                } catch (e) { }
            }
    }

    PureMetrics.prototype.setAccount = function(accountId) {
        ACCOUNT_ID = accountId;
    }

    PureMetrics.prototype.debug = function(enabled) {
        DEBUG = enabled;
    }

    PureMetrics.prototype.sessionStart = function(type) {
        if(_.isBlockedUA(userAgent)){
            console.log('blocked');
            return;
        }
        console.log('started');
        var currentTime = Date.now();
        var lastSessionId = _.getCookie('_pmls') || 0;
        var userId = _.getCookie('_pmai');
        var deviceId = _.getCookie('_pmdi');
        var userLang = navigator.language || navigator.userLanguage;
        var url = CONFIG.PROTOCOL+CONFIG.API+'?sdkv='+LIB_VERSION;
        var ev = '';
        if(_.isUndefined(userId) || userId == ''){
            userId = _.generateUUID();
            //TRACK event acq
            ev += 'acq|';
        }
        if(_.isUndefined(deviceId) || deviceId == ''){
            var browser = _.deviceInfo.browser(userAgent, vendor, opera);
            var os = _.deviceInfo.os();
            deviceId = browser+'-'+userId;
            url = url+'&b='+browser+'&bv='+_.deviceInfo.browserVersion(userAgent, vendor, opera)+'&os='+os+'&ul='+userLang+'&sd='+window.screen.colorDepth+'&sr='+window.screen.width+'x'+window.screen.height;
        }
        if(_.isUndefined(lastSessionId)|| lastSessionId == 0){
            lastSessionId = Date.now();
        }else if( currentTime - lastSessionId < 1800000){
            return;
        }
        ev += 'ss';
        if(!_.isUndefined(type)|| type != ''){
            ev+='-'+type;
        }
        
        _.setCookie('_pmdi', deviceId);
        _.setCookie('_pmai', userId);
        _.setCookie('_pmls', lastSessionId);
        var tzOffset = new Date().getTimezoneOffset();
        var userLang = navigator.language || navigator.userLanguage;
        //TODO check if the device details have been set to the server already, if not then resend
        //TODO compare last session from cookie and then hit a session start
        //TODO MAKE A SESSION START CALL
        url = url
        +'&dl='+window.location.hostname
        +'&path='+window.location.pathname
        +'&ts='+currentTime
        +'&tz='+tzOffset
        +'&ac='+ACCOUNT_ID
        +'&ai='+userId
        +'&di='+deviceId
        +'&ev='+ev;
        if(DEBUG){
           url+="&debug=true";//set debug true when running in debug mode
        }
        var img = document.createElement('img');
        img.src = url;
        img.width = 1;
        img.height = 1;
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(img, s.childNodes[0]);
    }

    //for closure compiler
    window['_pmq']                          = window._pmq;
    PureMetrics.prototype['push']           = PureMetrics.prototype.push;
    PureMetrics.prototype['setAccount']     = PureMetrics.prototype.setAccount;
    PureMetrics.prototype['sessionStart']   = PureMetrics.prototype.sessionStart;
    PureMetrics.prototype['debug']          = PureMetrics.prototype.debug;

    _['deviceInfo']                         = _.deviceInfo;
    _['deviceInfo']['device']               = _.deviceInfo.device;
    _['deviceInfo']['browser']              = _.deviceInfo.browser;
    _['deviceInfo']['os']                   = _.deviceInfo.os;
    _['deviceInfo']['browserVersion']       = _.deviceInfo.browserVersion;

        // get the existing _gaq array
    var _old_pmq = window._pmq;

    // create a new _gaq object
    window._pmq = new PureMetrics();

    // execute all of the queued up events - apply() turns the array entries into individual arguments
    window._pmq.push.apply(window._pmq, _old_pmq);
})();
