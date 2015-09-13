var System = {
    currentScreen: null,
    touches: null,
    buttons: null,
    screenAsButton:null,
    systemTime: 0,
   // applicationTime: 0,
   // timeSpeed: 1.0,
     isMobile: false,
    _lastTime: 0,
    boot: function (startScreen) {
        cv = document.getElementById('cv');
        cv.width = W = canvasWidth;
        cv.height = H = canvasHeight;
        W/=scale;
        H/=scale;
        cvRect = cv.getBoundingClientRect();
        ctx = cv.getContext('2d');
//        ctx.imageSmoothingEnabled = ctx.webkitImageSmoothingEnabled  imageSmoothingEnabled;
        ctx.textAlign="center";
        ctx.textBaseline = 'middle';

        var hs = localStorage['hiScore'];
        if (+hs != hs ) localStorage['hiScore'] = 0;

        function onResize(e) {
            var canvasRatio = canvasWidth / canvasHeight;
            var rw = window.innerWidth;
            var rh = window.innerHeight;
            var hArea = rw * (rw / canvasRatio);
            var vArea = rh * (rh * canvasRatio);
            if (hArea > vArea) {
                // use max width
                var maxWidth = Math.min(rw, Math.floor(rh * canvasRatio));
                cv.style.width = maxWidth + 'px';
                cv.style.height = Math.floor(maxWidth / canvasRatio) + 'px';
                ratio = maxWidth / W;
            } else {
                // use max height
                var maxHeight = Math.min(rh, Math.floor(rw / canvasRatio));
                cv.style.width = Math.floor(maxHeight * canvasRatio) + 'px';
                cv.style.height = maxHeight + 'px';
                ratio = maxHeight / H;
            }
            cvRect = cv.getBoundingClientRect();
        }
        onResize();
        window.onresize = onResize;
        window.ondeviceorientation = onResize;

        setupStandardGradient();
        this.isMobile = isMobile();
        if (this.isMobile) {
            timeSpeed = 0.8;
            setupTouches();
        } else {
            setupKeys();
            if (showTouch) {
                setupTouches();
            } else {
                this.touches = null;
            }
        }

        this.launchScreen(startScreen);
        this.launchAnimation();
    },

    launchScreen: function (newScreen) {
        this.currentScreen = newScreen;
        newScreen.launch();
    },

    //  ---------- Animation ----------

    launchAnimation: function () {
        requestAnimationFrame(this._launchAnimation.bind(this));
    },

    _launchAnimation: function (now) {
        this._lastTime = now;
        this.currentScreen.launch();
        this._boundAnimate = this._animate.bind(this);
        requestAnimationFrame(this._boundAnimate);
    },
    _boundAnimate: null,
    _animate: function (now) {
        requestAnimationFrame(this._boundAnimate);
        // _______________________
        var dt = now - this._lastTime;
        // if (dt < 10) return; // 60 HZ max
        if (dt > 50) dt = 16; // consider 1 frame elapsed on tab-out
        this._lastTime = now;

        dt *= timeSpeed;
        //
        this.systemTime += dt;
       // this.applicationTime += dt;

        var buttons = (this.currentScreen == playScreen) ? this.buttons : this.screenAsButton;
        //
        if (buttons) buttons.update();
        this.currentScreen.update(dt);
        //
        this.currentScreen.draw();
        if (buttons && buttons.draw) buttons.draw();
    },
    sysNow  : function () {
        return System.systemTime;
    }
};

// -----------------------------------
//             boilerplate
// -----------------------------------

var cv = null;
var ctx = null;
var cvRect = null;
var W = 0,
    H = 0;
var ratio = 1;