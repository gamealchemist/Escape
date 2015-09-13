// https://github.com/mneubrand/jsfxr/blob/master/jsfxr.js

/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
//      this[String.fromCharCode( 97 + i )] = values[i] || 0;
        this[i] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this[2] < .01) {
      this[2] = .01;
    }

    var totalTime = this[1] + this[2] + this[4];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this[1]  *= multiplier;
      this[2] *= multiplier;
      this[4]   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p[5] * p[5] + .001);
    _maxPeriod    = 100 / (p[6]   * p[6]   + .001);

    _slide        = 1 - p[7] * p[7] * p[7] * .01;
    _deltaSlide   = -p[8] * p[8] * p[8] * .000001;

    if (!p[0]) {
      _squareDuty = .5 - p[13] / 2;
      _dutySweep  = -p[14] * .00005;
    }

    _changeAmount =  1 + p[11] * p[11] * (p[11] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p[12] == 1 ? 0 : (1 - p[12]) * (1 - p[12]) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p[1]  * p[1]  * 100000;
    _envelopeLength1 = p[2] * p[2] * 100000;
    _envelopeLength2 = p[4]   * p[4]   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(webAudioBuffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p[18] != 1 || p[21],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p[21] * p[21] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p[22] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p[18] * p[18] * p[18] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p[19] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p[18] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p[23] * p[23],
        // Minimum frequency before stopping
        _minFreqency = p[6],
        // If the phaser is active
        _phaser = p[16] || p[17],
        // Change in phase offset
        _phaserDeltaOffset = p[17] * p[17] * p[17] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p[16] * p[16] * (p[16] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p[15] ? ((1 - p[15]) * (1 - p[15]) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p[3],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p[9] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p[10] * p[10] * .01,
        // The type of wave to generate
        _waveType = p[0];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p[20] * p[20] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    var i = 0;
    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for ( i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for ( i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for ( i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit && (++_changeTime >= _changeLimit) ) {
          _changeLimit = 0;
          _period *= _changeAmount;
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
          _squareDuty = clamp(_squareDuty + _dutySweep, 0, .5);
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;
          _envelopeStage++;
          _envelopeLength =  _envelopeStage==1 ? _envelopeLength1 : _envelopeStage==2 ? _envelopeLength2 : -1;
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
          _hpFilterCutoff = clamp(_hpFilterCutoff*_hpFilterDeltaCutoff, .00001, .1);
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
            _lpFilterCutoff = clamp(_lpFilterCutoff*_lpFilterDeltaCutoff, 0, .1);

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      webAudioBuffer[i] = _superSample >= 1 ? 1 : _superSample <= -1 ? -1 : _superSample ;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();

// Export for the Closure Compiler
window['jsfxr'] = function(settings) {
    var AudioContext = window.AudioContext // Default
        || window.webkitAudioContext
  window._audioContext =  window._audioContext ||  new AudioContext() ;
  var context = window._audioContext ; 
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var sampleCount = ((envelopeFullLength + 1) >> 1 ) << 1 ;
  var webAudioBuffer = context.createBuffer(1, sampleCount, context.sampleRate);
      var buffer = webAudioBuffer.getChannelData(0);
  synth.synthWave(buffer, envelopeFullLength) * 2;
  return webAudioBuffer;
}


window['playSound'] = function(settingsOrWABuffer, pitchChange, randPitch, timeOffset) {
    // last minute hack
    if (System.currentScreen != playScreen) return;

	var buffer = (typeof settingsOrWABuffer == "Array") ? jsfxr(settingsOrWABuffer) : settingsOrWABuffer  ;
	var context = window._audioContext;
	var source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    pitchChange =  pitchChange || 0;
    randPitch =  randPitch || 0;
    timeOffset = timeOffset || 0;
    if (randPitch) randPitch = randPitch * ( Math.random() - 0.5);
if (source.detune)    source.detune.value=100*(pitchChange + randPitch);
    source.connect(context.destination);
    source.start( context.currentTime + timeOffset );
};

window['buildLoopBuffer'] = function( settingsOrWABuffer ) {
  var buffer = (typeof settingsOrWABuffer == "Array") ? jsfxr(settingsOrWABuffer) : settingsOrWABuffer  ;
  var context = window._audioContext;
  var source = context.createBufferSource();
    var gain = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0.4;
  source.loopEnd = 1.2 ;
    gain.connect(context.destination);
  source.connect(gain);
  source.start( context.currentTime );
  return gain;
};


// resources loader
(function setupLoader() {

//    window.AnyFile = XMLHttpRequest;

    var rscCount = 1;
 //   var errorCount = 0;
    //var errMsgs = '';

    window.addRsc = function (rscType, rscUrl) {
        var rsc = new rscType();
        rscCount++;
        rsc.addEventListener('load', loadEnded)
        //      rsc.addEventListener('error', errorWhileLoading);
//        if (rscType !== AnyFile)
            rsc.src = rscUrl;
//        else {
//            rsc.open("GET", rscUrl, true);
//            rsc.send(null);
//        }
        return rsc;
    };

    window.addEventListener('load', loadEnded);

    function loadEnded() {
        rscCount--;
        if (!rscCount) launchMain();
    }
/*
    function errorWhileLoading(e) {
        errorCount++;
        rscCount--;
        errMsgs +=  e.src + ' '  + e.message + '\n';
        if (!rscCount) launchMain();
    }
    */

    function launchMain() {
//        if (errorCount) alert('errors while loading rsc : \n' + errMsgs);
        main();
    }
})();

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

var debug = false;
var showTouch = false ; // && debug;
var startLevel = 1;

var gradients = {};

var ratio = 4/3 ;
var canvasWidth = 640;
var canvasHeight = 0 | (  canvasWidth / ratio ) ;
// var imageSmoothingEnabled = true;

var scale = 0.85;


// ---------  Game Parameters   -------------
var blockWidth = 72;
var blockHeight = 40;

var camXMargin = 40,
    camYMargin = 100;

var heroWidth = 40;
var heroHeight = 60;
var heroSpriteWidth = 32;
var heroSpriteHeight = 32;
var gravity = 0.0025;
var gravityDirection = 1;
var vPunch = 0.80;
var friction = 0.145;
var maxThrust = 0.0034;
var maxVSpeed = 0.68;
var lifeLooseSpeed = 0.2/16;

var levelStartDisplayTime = 2000;
var feltDisplayTime = 800;
// var wonGameDisplayTime = 4000;

var platformAlpha = 0.85;

var cityRelativeEnd = 0.4;
var cityRelativeHeight = 0.35;
var cityRelativeSpeed = 0.4;

var timeSpeed = 0.95;

// Colors
var hueColors = [ 0, 240 ];
var colors = [ hsl(hueColors[0], 80, 55 ) , hsl(hueColors[1], 80, 55 ) ];

var RSC = {
    heroSpriteImg : addRsc(Image, 'skaterb.png')
    ,level1 : addRsc(Image, 'level1.png')
  ,level2 : addRsc(Image, 'level2.png')
    ,level3 : addRsc(Image, 'level3.png')
//    ,level4 : addRsc(Image, 'rsc/level4.bmp')
};



function isMobile() {
    var mobileMatch = /iphone|ipod|ipad|android|ie|blackberry|fennec|mobile/i;
    return navigator.userAgent.toLowerCase().match(mobileMatch);
}

function clamp(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

function sq(x) {
    return x * x;
}

function sinOsc(amp, freq, clock) {
    clock = clock || Date.now ;
    return amp * Math.sin(freq * 0.06 * clock());
}

function osc(min, max, freq, clock) {
    clock = clock || Date.now ;
    var hAmp = (max - min) / 2;
    return min + hAmp * ( 1 + Math.sin(freq * 0.06 * clock()));
}

function dirac(min, max, highPeriod, totalPeriod, clock, startTime) {
    clock = clock || Date.now ;
    startTime = startTime || 0;
    var t = ( (clock() - startTime) % totalPeriod ) ;
    if (t<highPeriod) return max;
    else return min;
}


var InputState = [];

var keys = {
    LEFT: 37,
    UP: 38,
    UP2 : 40,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32
};

function clearInputs() {
    for (var k in keys) {
        InputState[keys[k]] = false;
    }
}

function setupKeys() {
    window.addEventListener('keydown', function (e) {
        var keyCode = e.keyCode || e.which;
        InputState[keyCode] = true;
        e.stopPropagation();
        e.preventDefault();
    }, false);
    window.addEventListener('keyup', function (e) {
        var keyCode = e.keyCode || e.which;
        InputState[keyCode] = false;
    }, false);
}


function setupTouches() {

    // prevent a lot of strange behaviours on mobiles
    window.ontouchmove = function (e) {
        e.preventDefault();
    };

    window.ontouchstart = function (e) {
        e.preventDefault();
    };

    // setup the buttons.

    function ael(en, f) {
        cv.addEventListener(en, f);
    }

    System.screenAsButton = new TouchButton('SPACE', 0,0,W,H, true, true);

    var buttons = System.buttons = [];
    var hMargin = 0.03*W,
        vMargin = 0.03 * H;
    var hSize = 0.18*W,
        vSize = 0.16*H;
    var uid=1;
    var baseY = H - vMargin - vSize;

    buttons.push(new TouchButton('LEFT', hMargin, baseY, hSize, vSize));
    buttons.push(new TouchButton('RIGHT', hSize + 2 * hMargin, baseY, hSize, vSize));
    buttons.push(new TouchButton('UP', W - 2*hSize - hMargin, baseY, hSize, vSize));
    buttons.push(new TouchButton('SPACE', W -  hSize - hMargin, baseY - vMargin -vSize, hSize, vSize, true));

    buttons.draw = function () {
        buttons.forEach(function(x) {x.draw(); });
    };

    buttons.update = function () {
        buttons.forEach(function(x) {x.update(); });
    };

    // fill touches
    var touches = System.touches = [];
    var touchCount = 0;
    for (var i = 0; i < 10; i++) {
        touches.push(new TouchInfo());
    }

    function getTouch(id) {
        for (var i = 0; i < 10; i++) {
            var thisTouch = touches[i];
            if (thisTouch.id == id) {
                return thisTouch;
            }
        }
        return null;
    }

    function stop(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    ael( 'touchstart', function (event) {
        stop(event);
        var newTouches = event.changedTouches;
        for (var i = 0; i < newTouches.length; i++) {
            var thisTouch = newTouches[i];
            var ti = getTouch(-1);
            if (ti != null) {
                uid++;
                ti.pos.x = (thisTouch.clientX - cvRect.left) / ratio;
                ti.pos.y = (thisTouch.clientY - cvRect.top) / ratio;
                ti.id = thisTouch.identifier;
                ti.uid=uid;
                touchCount++;
            }
        }
    });

    ael('touchmove',function (event) {
        stop(event);
        var newTouches = event.changedTouches;
        for (var i = 0; i < newTouches.length; i++) {
            var thisTouch = newTouches[i];
            var ti = getTouch(thisTouch.identifier);
            if (ti != null) {
                ti.pos.x = (thisTouch.clientX - cvRect.left) / ratio;
                ti.pos.y = (thisTouch.clientY - cvRect.top) / ratio;
                touchCount--;
            }
        }
    });

    function onCancel(event) {
        var newTouches = event.changedTouches;
        for (var i = 0; i < newTouches.length; i++) {
            var thisTouch = newTouches[i];
            var ti = getTouch(thisTouch.identifier);
            if (ti != null) {
                ti.id = -1;
                touchCount--;
            }
        }
    }

    ael('touchend', onCancel );
    ael('touchcancel', onCancel);

    touches.oneTouchInsideRect = oneTouchInsideRect;

    function oneTouchInsideRect(rect) {
        if (touchCount == 0) return null;
        // var seenTouch = 0;
        for (var i = 0; i < touches.length; i++) {
            var thisTouch = touches[i];
            if (thisTouch.id >= 0) {
                if (rect.pointInside(thisTouch.pos.x, thisTouch.pos.y)) {
                    return thisTouch;
                }
                //seenTouch++;
                //if (seenTouch == touchCount) return null;
            }
        }
        return null;
    }
}

// storage class

function TouchInfo() {
    this.id = -1;
    this.pos = {
        x: 0,
        y: 0
    };
}


function TouchButton(name, x, y, w, h, once, donotdisplay) {
    this.name = name;
    BBox.call(this, x, y, w, h);
    this.id=-1;
    this.uid = -1;
    this.switchId = -1;
    this.once = once || false;
    this.draw = function () {
        if (donotdisplay) return;
        ctx.save();
        ctx.fillStyle = '#F5F';
        ctx.globalAlpha = 0.3;
        roundRect(ctx, this.x, this.y, this.w, this.h, 0.12*this.w);
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#F5F';
        ctx.stroke();
//        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.globalAlpha = 0.8;
        var angle = null;
        if (name == 'LEFT') angle = Math.PI;
        if (name == 'RIGHT') angle = 0;
        if (name == 'UP') angle = -Math.PI / 2;
        if (angle != null) {
            drawArrow(this.x + w * 0.2, y + h * 0.2, w * 0.6, h * 0.6, angle, '#A96');
        } else {
            var minSize = Math.min(this.w, this.h);
            var lw = 0.3 * minSize;
            var 	radius = minSize *0.3;
            ctx.lineWidth = lw;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.strokeStyle = 'hsl(246, 80%, 70%)';
            ctx.arc(this.x+(this.w >>1), this.y+(this.h>>1), radius, 0, Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = 'hsl(359, 80%, 70%)';
            ctx.arc(this.x+(this.w >>1), this.y+(this.h>>1), radius, Math.PI, 2*Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    };
    this.update = function () {
        var lastState = InputState[keys[this.name]];
        var actualState = System.touches.oneTouchInsideRect(this);
        var newState = false;
        if (!this.once) {
            newState = actualState;
        } else {
            if (!lastState && actualState  && this.switchId != actualState.uid) {
                this.switchId =  actualState.uid;
                newState = true;
            }
        }
        InputState[keys[this.name]] = newState;
    };
    //  
}

function drawArrow(x, y, w, h, angle, fillStyle, strokeStyle, lineWidth) {
    var aw = w / 8;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.translate(-w / 2, -h / 2);
    ctx.moveTo(2 * w / 3, h * (1 - 1 / 5));
    ctx.lineTo(w, h / 2);
    ctx.lineTo(2 * w / 3, h * (1 / 5));
    ctx.lineTo(2 * w / 3, h / 2 - aw);
    ctx.lineTo(0, h / 2 - aw);
    ctx.lineTo(0, h / 2 + aw);
    ctx.lineTo(2 * w / 3, h / 2 + aw);
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth || 4;
        ctx.stroke();
    }
    ctx.restore();
}

// -----------------------------------
//             BBox
// -----------------------------------

function BBox(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.overlaps = function (other) {
        return !((this.x > other.x + other.w) || (this.x + this.w < other.x) || (this.y > other.y + other.h) || (this.y + this.h < other.y));
    };
    this.pointInside = function (x, y) {
        if (gravityDirection>0)
           return (x >= this.x) && (x < this.x + this.w) && (y >= this.y) && (y < this.y + this.h);
        else
            return (x > this.x) && (x <= this.x + this.w) && (y > this.y) && (y <= this.y + this.h);
    };
    this.vSegmentIntersect = function (x, y1, y2) {
        if ((x < this.x) || (x >= this.x + this.w)) return false;
        if ((y2 >= this.y) && (y2 < this.y + this.h)) return true;
        var compareAgainst = this.y;
        if (y1 > y2) compareAgainst += this.h;
        return (compareAgainst - y1) * (compareAgainst - y2) <= 0;
    };
}


function Building(startY, bw, bh, w, baseRand) {

    var buildingColor = '#333';
    var buildingRedColor = '#433';
    var buildingBlueColor = '#334';

    var endGradientStart = startY+bh-1;
    var endGd = createGradient([0,endGradientStart,0, H], [0, buildingColor, 1, '#000']);

    startY += bh;
    this.draw = function (startX) {
        var screenSizeInBlocks = 0 | ( w / bw );
        var startingBlock = 0 | (startX / bw);
        ctx.save();
        ctx.translate(-startX, startY);
        for (var i = startingBlock - 1; i <= startingBlock + screenSizeInBlocks + 1; i++) {
            drawBuilding(i, bw, bh, 0, baseRand);
        }
        ctx.restore();
        fillToEnd();
    };

    function drawBuilding(x, bw, bh, baseY, baseRand) {

        var r1 = (17159 * x + baseRand) % 569;
        var r2 = (16339 * x + baseRand) % 677;
        var r3 = (34963 * x + baseRand) % 2969;

        var bdWidth = 4 + (r1 % 5); // 4 --> 6
        var bdHeight = 3 + (r2 % 12) // 3 --> 14

        //ctx.fillStyle = buildingColor;
        ctx.fillStyle =  ((r1+r2 )%2) ? buildingRedColor : buildingBlueColor ;
        ctx.save();
        ctx.translate(x * bw, baseY - bh * bdHeight / 14);
        ctx.scale(bw * bdWidth / 6, bh * bdHeight / 14);
        ctx.fillRect(0, 0, 1, 1);

        var timeSlice = 4200 + (r3 % 6000);
        var timeZone = 0 | (Date.now() / timeSlice);
        var r4 = (7717 * x + baseRand + timeZone * 33641) % 5791;

        ctx.fillStyle = '#777700'; // #FFFF99
        var winCount = 0 | (r4 / 5791) * (0.2 * bdWidth * bdHeight);
        for (var i = 0; i < winCount; i++) {
            var xMargin = 0.2 / bdWidth;
            var yMargin = 0.15 / bdHeight;
            var wx = (r4 + ((i * 34217) % 1321)) % bdWidth;
            var wy = (r4 + ((i * 35141) % 1873)) % bdHeight;
            ctx.fillRect(wx / bdWidth + xMargin, wy / bdHeight + yMargin,
                1 / bdWidth - 2 * xMargin, 1 / bdHeight - 2 * yMargin);
        }
        ctx.restore();
    }

    function fillToEnd() {
        ctx.fillStyle = endGd ;
        ctx.fillRect(0,endGradientStart, W, H - endGradientStart);
    }
}

// creates and returns a canvas having provided width, height
function createCanvas ( w, h ) {
    var newCanvas = document.createElement('canvas');
    newCanvas.width  = w;     newCanvas.height = h;
    return newCanvas;
}

function buildShadow (image, fillStyle) {
    var newCanvas = createCanvas(image.width, image.height) ;
    var newCtx= newCanvas.getContext('2d');
    newCtx.save();
    newCtx.fillStyle = fillStyle ;
    newCtx.fillRect(0,0,newCanvas.width, newCanvas.height);
    newCtx.globalCompositeOperation='destination-in';
    newCtx.drawImage(image,0,0);
    newCtx.restore();
    return newCanvas;
}

function buildImageData(img) {
    var cv =  createCanvas(img.width, img.height);
    var ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0,0,img.width, img.height);
}

function turnRedToBlue(img) {
    var id =  buildImageData(img);
    var d = id.data;
d[50]=10;
    for (var i=0; i< d.length-100; i+=4 ) {
        if ( d[i+2] > 250 ) {
            d[i]    = 255;
            d[i+1]=0;
            d[i+2] = 0;
            d[i+2]  = 0;
           }
    }
    id.data = d;

    var c = createCanvas(img.width, img.height);
     c.getContext('2d').putImageData(id,0,0);
    return c;
}
// -----------------------------------
//             Colors
// -----------------------------------

function setupStandardGradient() {
    gradients = {
        0: createPlatformGradient(hueColors[0]),
        /*        createGradient([0, 0, 0, 1], [0, '#844',
         0.5, '#F88',
         1, '#844']),
         */
        1:  createPlatformGradient(hueColors[1]),
        /* createGradient([0, 0, 0, 1], [0, '#5B7595',
         0.5, '#9CACC1',
         1, '#5B7595']),*/

        o0: createGradient([0, 0, 1, 0], [0, '#844',
            0.5, '#F88',
            1, '#844']),

        o1: '#9F8',

        str: '#242',

        bg: createGradient([0, 1, 0, 0],
            [0, hsl(195, 100, 10),
            1, hsl(195, 100, 40)])
    };
}

/*
function setupGreenGradient() {
    gradients = {
        0: '#D66',
        1: '#66D',
        str: '#0B0',
        bg: '#000'
    };
}

    */
function drawImage(img, x,y,sw,sh,dw,dh,flipX, flipY, _index) {
    _index = _index || 0;
    var sx = 0;
    if (_index) sx += sw * _index;
    ctx.save();
    ctx.translate(x, y);
    if (flipX) {
        ctx.translate(dw , 0);
        ctx.scale(-1, 1);
    }
    if (flipY) {
        ctx.translate(0, dh );
        ctx.scale(1, -1);
    }
    ctx.drawImage(img, sx, 0, sw, sh, 0,0,dw, dh);
    ctx.restore();
}

function glowText(txt, x, y, fontSize, txtHue) {
    sft( fontSize );
    var far = 1000;
    var dx = 6;
    ctx.save();
    ctx.fillStyle='#FFF';
    ctx.globalAlpha = 0.9;

    ctx.shadowColor =  hsl(235, 85, 95);
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = scale * (far - 4 - 2 * Math.random()); // !! canvas bug, scale is forgotten !!
    ctx.shadowOffsetY = scale * ( -4 +  Math.random());

    ctx.fillText(txt, x - far, y);
    ctx.fillText(txt, x - far, y);

    ctx.shadowColor = hsl(350, 75, 85);
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = scale * ( far + dx + 2 * Math.random()) ; // !! canvas bug, scale is forgotten !!
    ctx.shadowOffsetY = scale * ( dx +  Math.random() );
    ctx.fillText(txt, x - far, y);
    ctx.fillText(txt, x - far, y);

    ctx.globalAlpha = 1;
    ctx.shadowColor = null;
    ctx.fillStyle = txtHue;
    ctx.fillText(txt, x, y);
    ctx.restore();
}
function createPlatformGradient(baseHue) {
    var cv2 = document.createElement('canvas');
    cv2.width = cv2.height = 64;
    var ctx2 = cv2.getContext('2d');

    var cw = 0.15;

    var c1= hsl(baseHue, 65, 40);
    var c2= hsl(baseHue, 75,45);
    var c3 = hsl(baseHue, 90, 65);
    var c4 = hsl(baseHue, 100, 80);

    var gd = createGradient([0, 0, 64, 64], [
        0, c1,
        0.25 - cw - 0.01, c2,
        0.25 - cw, c3,
        0.25, c4,
        0.25 + cw, c3,
        0.25 + cw + 0.01, c2,
        0.5  , c1,
        0.75 - cw - 0.01, c2,
        0.75 - cw, c3,
        0.75, c4,
        0.75 + cw, c3,
        0.75 + cw + 0.01, c1,
        1, c1]);

    ctx2.fillStyle = gd;
    ctx2.fillRect(0, 0, 64, 64);

    return ctx.createPattern(cv2, "repeat");
}

function hsl(h, s, l) {
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}
 function roundRect (ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
     return ctx;
  }


function sft(s) {
    ctx.font = s + "px Futura, Helvetica, sans-serif";
}

/*
function s() {
    ctx.save();
}

function r() {
    ctx.restore();
}

function tr(x,y) {
    ctx.translate(x,y);
}

function sc(x,y) {
    ctx.scale(x,y);
}

function fr(x,y,w,h) {
    ctx.fillRect(x,y,w,h);
}

function sfs(s) {
    ctx.fillStyle = s;
}

function sss(s) {
    ctx.strokeStyle = s;
}

function slw(l) {
    ctx.lineWidth = l;
}

function mt(x,y) {
    ctx.moveTo(x,y);
}

function lt(x,y) {
    ctx.lineTo(x,y);
}

function sgo(m) {
    ctx.globalCompositeOperation = m;
}

function sga(a) {
    ctx.globalAlpha = a;
}

function mga(a) {
    ctx.globalAlpha *= a;
}

function bp() {
    ctx.beginPath();
}
*/



function erase() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
}


function fillBG() {
    ctx.save();
    ctx.fillStyle = gradients.bg;
    ctx.scale(W, 0.55*H);
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
}

function createGradient(coords, stops) {
    var gd = ctx.createLinearGradient.apply(ctx, coords);
    for (var i = 0; i < stops.length; i += 2) {
        gd.addColorStop(stops[i], stops[i + 1]);
    }
    return gd;
}
function createZeroRadialGradients(coords, color, steps) {
    var stops=[0, '#000', 0, color, 1, '#000'];
    return createRadialGradients(coords, stops, steps);
}

function createRadialGradients(coords, stops, steps) {
    var res=[];
    var stepInv = 1 / ( steps + 1 );
    for(var i=1;i<=steps; i++) {
        stops[2]= stepInv * i;
        res.push(
            createRadialGradient(coords, stops)
        );
    }
    return res;
}

function createRadialGradient(coords, stops) {
    if (coords.length==3) {
        coords = [coords[0], coords[1], coords[2]]; // copy to avoid modifying reference...
        coords.push(coords[0], coords[1], coords[2]);
        coords[2] = 0; // ... like here...
    }
    var gd = ctx.createRadialGradient.apply(ctx, coords);
    for (var i = 0; i < stops.length; i += 2) {
        gd.addColorStop(stops[i], stops[i + 1]);
    }
    return gd;
}
var SOUNDS = {
    jump : jsfxr([, , 0.17, , 0.17, 0.36, 0.17, 0.24, -0.074, , , 0.06, 0.65, 0.26, 0.28, 0.49, ,, 0.7, 0.086, 0.12, 0.14, , 0.5])
    , landed :jsfxr([, 0.06, 0.08, 0.2, 0.15, 0.57, , -0.6, -0.07, , , 0.34, , 0.37, 0.18, , , , 0.42, 0.14, , , , .46])
    ,reversing : jsfxr([1, 0.1, 0.3, 0.13, 0.4, 0.28, 0.06, 0.1, 0.053, 0.3, 0.4, 0.1, 0.2, 0.9, 0.08, , , , 0.76,,,,, 0.5])
    ,blip : jsfxr([1, , 0.067, 0.07, 0.12, 0.888, , 0.012, 0.02, , , 0.23, 0.6, 0.067, 0.102, , , 0.52, 1, ,, , , 0.2])
    , noise : jsfxr([3, 0.58, 0.25, 0.059,
        -0.586, 0.345, , 0.0346, -0.062,
        -0.00008, -0.61, 0.91, -0.37,
        0.75, 0.36, -0.65, -0.6,
        0.019, 0.23, -0.002, -0.03,
        9.90e-8, 1.6e-7, 0.18])
};

/* Convention :
An RGB Point of the image is understood as a 3 bit value. 0 -> 0 255 -> 1.
1 -> Platform Color 0
1 -> Platform Color 1
3 -> Blinking Platform Color 0
4 -> Blinking Platform Color 1
5 -> End of level
6 -> trajectory of moving platforms.
7 -> Gravity Switch

For convenience, the first 7 points of the image keeps the 7
possibles colors, so they are skipped.
 */

function decodeLevel(level, img) {
    var imgWidth = img.width;
    var data = (buildImageData(img)).data;
    var data2 = (buildImageData(img)).data;

    level.platforms = [];

    var i=0;

    // retrieve platforms and End of Level.
  for ( i=7*4; i<data.length; i+=4) {
      var decoded = decodeData(data, i);
      if (!decoded) continue;
      if (decoded < 7) {
          var w = getPlatformLength(data, decoded, i);
          var h = getPlatformHeight(data, w, decoded, i);
          var pi = i >> 2;
          var x = pi % imgWidth;
          var y = ( pi - x ) / imgWidth;
          if (decoded <5) {
              // still or moving platform
              var blinking = decoded >=3 ;
              var color = (decoded - 1) & 1 ;
              level.platforms.push([x , y , w, h, color, (+blinking) * level.platformPeriod]);
          } /* else if (decoded == 6) {
              // direction for moving platforms
              platformsDirections.push([x , y , w, h ]);
          } */ else if (decoded == 5) {
              // end of level
              level.triggers.push(new Trigger(['end', x , y , w, h, findEndSwitchDirection(x,y) ]));
          }
      } else if (decoded == 7) {
          addGravitySwitch( level,  { x: (i >> 2) % imgWidth, y: ( 0 | ((i>>2)/imgWidth)) } );
      }
  }
    // dispatch what has been found in platforms / movingPlatforms / End switch.

    // level.movingPlatforms=[];
/*    for (i=0; i<rawPlatforms.length; i++) {
        var thisP = rawPlatforms[i];
        updateIfIsAMovingPlatform(thisP, platformsDirections);
        if (thisP.length == 6) {

        } else {
            level.movingPlatforms.push(thisP);
        }
    }
*/
    level.dataLoaded = true;

    // return;

    // -----------------------------------------------------------------

    function findEndSwitchDirection(x,y) {
        var pos = ((y-1)*imgWidth + x)<<2;
        if (decodeData(data2, pos)) return -1;
        return 1;
    }


    function addGravitySwitch(level, switchCoords) {
        var dir =1;
        var pos = ((switchCoords.y-1)*imgWidth + switchCoords.x)<<2;
        if (decodeData(data2, pos)) dir *=-1;
        level.triggers.push(new Trigger([ 'flip', switchCoords.x, switchCoords.y, 1, 1, dir ]));
    }

    /*
    function updateIfIsAMovingPlatform(platform, directions) {
        var i=0;
        var isMoving = false;
        var x2 = platform[0];
        var y2 = platform[1];
        for ( i=0; i<directions.length; i++) {
            var thisTraj = directions[i];
            // above the first pixel ?
            if (thisTraj[0] == platform[0] && thisTraj[1] + thisTraj[3] == platform[1] ) {
                isMoving = true;
                y2 -=thisTraj[3];
            } else // After the last h pixel
            if (thisTraj[1] == platform[1] && platform[0] + platform[2] == thisTraj[0]  )  {
                isMoving = true;
                x2+=thisTraj[2];

            }
        }
        if (isMoving) {
            platform.splice(2, 0, x2, y2);
            platform.push(level.platformSpeed);
        }
    }
    */

    function getPlatformLength(data, color, index ) {
        var length = 0;
        do {
            index+=4;
            length++;
        } while (index < data.length && decodeData(data, index) == color);
        return length;
    }

    function getPlatformHeight(data, width,  color, index ) {
        var height = 0;
        do {
          clearLine(data, width, index);
          index+=imgWidth*4;
          height++;
       } while (index < data.length && decodeData(data, index) == color);
        return height;
    }

    function decodeData(data, index) {
        return  ( (data[index]>192) ? 4 : 0 ) +
         ( (data[index+1]>192) ? 2 : 0 ) +
         ( (data[index+2]>192) ? 1: 0 );
    }

    function clearLine(data, width, index) {
        var endLine = index + width*4
        for (; index<endLine; index+=4) clearData(data, index);
    }

    function clearData(data, index) {
        data[index] = data[index+1] = data[index+2] = 0;
    }
}
var level1 = {
  //  timeSpeed: 1,
    timeToComplete : 50000,
    heroPosition: {
        x: 2,
        y: 6
    },
    dataLoaded : false,
//    platformSpeed : 0.2,
    platformPeriod : 2800,
    platforms: null
        /* [ x, y, largeur, hauteur, couleur ( 0 ou 1 ) , periode (si oscillation)*/
//    movingPlatforms : null
        // [ x, y, x2, y2, w, h, speed, period]
    ,triggers: [
        // msg : x, y, w, h, txt, size, [ duration]
//        ['msg', 1, 3, 16, 'use arrow keys ← ↑ → to move'],
    ]
};
var level2 = {
    // timeSpeed: 1,
    timeToComplete : 50000,
    heroPosition: {
        x: 2,
        y: 5
    },
    dataLoaded : false,
//    platformSpeed : 0.2,
    platformPeriod : 2800,
    platforms: null
//    movingPlatforms : null
    ,triggers: [
    ]
};
var level3 = {
  //  timeSpeed: 1,
    timeToComplete : 80000,
    heroPosition: {
        x: 2,
        y: 6
    },
    dataLoaded : false,
//    platformSpeed : 0.1,
    platformPeriod : 2800,
    platforms: null
//    movingPlatforms : null
    ,triggers: [

    ]
};
// -----------------------------------
//             Camera
// -----------------------------------


function Camera (x,y,w,h) {
    BBox.call(this, x,y,w,h);
    this.scale = 1;
    this.reset= function () {
        this.x = this.y = 0;
        this.w=W; this.h=H;
    };
    this.adjust = function (target, dt) {
        var x = this.x,
            y = this.y;
        var targetX = target.x + target.w/2;
        var targetY =  target.y + target.h/2;
        var newX = x + target.vx*dt ,
            newY = y;
        var  newFwX = newX;
        var fwMixRatio = 0.3;
        var dx = targetX - x;
        var leftXBound = 0.30;
        var rightXBound = 0.7;

        var camRelXSpeed = 0.08;
        if (dx < leftXBound * W) {
            newX += camRelXSpeed * (dx - leftXBound * W) ;
        } else if (dx > rightXBound * W) {
            newX += camRelXSpeed * (dx  - rightXBound * W) ;
        }

        if ( Math.abs(target.vx)>0.1) {
            if ( target.vx>0 ) {
                rightXBound = 0.35;
            } else {
                leftXBound = 0.65;
            }
            if (dx < leftXBound * W) {
                newFwX += camRelXSpeed * (dx - leftXBound * W) ;
            } else if (dx > rightXBound * W) {
                newFwX += camRelXSpeed * (dx  - rightXBound * W) ;
            }
            newX = (1-fwMixRatio)*newX + fwMixRatio*newFwX;
        }

        var dy = target.y - y;
     //   var falling = gravityDirection * target.vy > 0;
      //  if (!falling) {
            var upperYBound = 0.45;
            var lowerYBound = 0.5;
            var camRelYSpeed = 0.02;
            if (dy < upperYBound * H) {
                newY += camRelYSpeed * (dy - upperYBound * H);
            } else if (dy > lowerYBound * H) {
                newY += camRelYSpeed * (dy - lowerYBound * H);
            } /* else {
                var trend = (gravityDirection > 0) ? 2 / 3 : 1 / 3;
                newY += 0.04 * (dy - trend * H);
            } */
      //  }
       /*  else // falling
        if (dy + target.h > H / 2) {
            newY += gravityDirection * 0.04 * (target.y + target.h - (y + H / 2));
        } */

        newX = clamp(newX, -camXMargin, playScreen.worldW + camXMargin );
        newY = clamp(newY, -camYMargin, playScreen.worldH + camYMargin );

        /*        if (newX < ) newX = -camXMargin;
         if (newX + W > ) newX = worldW - W;
         if (newY < -camYMargin) newY = -camYMargin;
         if (newY + H > worldH + camYMargin) newY = worldH + camYMargin - H;
         */
        this.x = 0 | newX;
        this.y = 0 | newY;
    };
}


// -----------------------------------
//             Hero
// -----------------------------------

var skateSound = null;

function Hero(x, y, w, h) {
    BBox.call(this, x, y, w, h);
    this.vx = 0;
    this.vy = 0;
    this.thrust = 0;
    this.jumping = false;
    this.jumpTime = 0;
    this.platform = null;
    this.unfalling = 0;
    this.lastPos = {platform : null, x : 0, y:0, lastGravityDirection : 1.0 };
    this.color = 0;
    this.life = 100;
    this.losingLife = 0;
    this.images = [ RSC['heroSpriteImg'+2], RSC['heroSpriteImg'] ];
    this.shadowImage = buildShadow(this.images[0], '#FFF');
    this.owner = null;
    var colorAnimCount = 10;
    var g1 = createZeroRadialGradients([0, 0, 1],colors[0], colorAnimCount);
    var g2 = createZeroRadialGradients([0, 0, 1],colors[1], colorAnimCount);
    var colorGradients = [g1, g2];
    if (!skateSound) {
        skateSound = buildLoopBuffer(SOUNDS.noise);
    }


    this.reset = function () {
        this.vx = 0;
        this.vy = 0;
        this.jumping = false;
        this.platform = null;
        this.thrust = 0;
        this.life = 100;
        this.losingLife = 0;
        this.color = 0;
        gravityDirection = 1
    };

    this.draw = function () {
        var shouldDrawBlink = false;
        if (this.losingLife || this.unfalling ) {
            var time = this.losingLife || this.unfalling;
            if (!(Math.floor((Date.now() - time) / 200) % 2)) {
                shouldDrawBlink = true;
            }
        }
        var flipX = this.vx < 0 ;
        var flipY = gravityDirection < 0 ;
        var imgIndex = 0;
        if (!this.platform && Math.abs(this.vx)>0.01) {
            imgIndex = this.vy*gravityDirection < 0 ? 1 : 2 ;
        }
        drawImage(this.images[this.color], this.x, this.y, heroSpriteWidth, heroSpriteHeight, heroWidth, heroHeight, flipX, flipY ,imgIndex );
        if (shouldDrawBlink) {
            ctx.save();
            ctx.globalAlpha *= 0.7;
            drawImage(this.shadowImage, this.x, this.y, heroSpriteWidth, heroSpriteHeight, heroWidth, heroHeight, flipX, flipY ,imgIndex );
            ctx.restore();
        }
    };

    this.drawColor = function() {
        var colorGradientIndex = 0 | ( colorAnimCount * (  osc(0, 1, 0.05, System.sysNow)));
        var color = colorGradients[this.color][colorGradientIndex];
        ctx.save();
        ctx.globalAlpha *= osc(0.3, 0.7, 0.237);
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.scale(1.4*this.h, 1.4*this.h);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(0 , 0, 1, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    };

    this.save = function () {
        this.lastPos.platform = this.platform;
   /*     if ( this.platform instanceof MovingPlatform ) {
            this.platform.save();
        }
    */    this.lastPos.x = this.x;
        this.lastPos.y = this.y;
        this.lastPos.lastGravityDirection = gravityDirection;
    };

    this.restore = function () {
        this.platform = this.lastPos.platform ;
      /*  if ( this.platform instanceof MovingPlatform ) {
            this.platform.restore();
        }
      */
        this.x = this.lastPos.x ;
        this.y = this.lastPos.y ;
        gravityDirection = this.lastPos.lastGravityDirection;
        this.jumping = false;
    };

    this.standStill = function () {
        this.vx = this.vy = this.thrust = 0;
    };

    this.update = function (dt) {

        skateSound.gain.value = (this.jumping) ? 0 : (Math.abs(this.vx) > 0.05) ? 2*Math.abs(this.vx) : 0.0;
        var thisPlatform = null;
        // ?? Are we loosing life ??
        if (this.platform && this.platform.color != this.color) {
            this.life -= lifeLooseSpeed*dt;
            if (!this.losingLife) this.losingLife = Date.now();
            if (this.life<0) {
                this.life = 0;
                messageScreen.launch('Game Over - No more energy-', 'Score : ' + playScreen.score,  2000, function() { System.launchScreen(titleScreen) });
            }
        } else {
            this.losingLife = 0;
        }

        // save current position if on a platform.
        if (this.platform) {
            this.save();
        }
        // Newton : speed
        // x
        this.vx += this.thrust * dt - this.vx * friction;
        // y : fall if need be
        if (this.platform == null) {
            this.vy =  clamp(this.vy + gravityDirection * gravity * dt, -maxVSpeed, maxVSpeed);
        } else {
            this.vy = 0;
        }
        // handle moving platforms
        var vx = this.vx;
        var vy = this.vy;
        thisPlatform = this.platform;
/*        if (thisPlatform && (thisPlatform.vx || thisPlatform.vy)) {
            vx += thisPlatform.vx;
            vy += thisPlatform.vy;
        }
*/
        // Newton : pos
        this.x += vx * dt;
        var currentY = this.y;
        var dy = vy * dt;

        var lowerPointX1 = this.x + this.w * (1 / 2 - 1 / 2.5);
        var lowerPointX2 = this.x + this.w * (1 / 2 + 1 / 2.5);

        var lowerPointY = currentY;
        if (gravityDirection == 1) {
            lowerPointY += this.h;
        }
        if (thisPlatform) {
          //  if (thisPlatform.pointInside(lowerPointX1, lowerPointY+dy) || thisPlatform.pointInside(lowerPointX2, lowerPointY+dy)) {
           if  ( (lowerPointX1 > thisPlatform.x+thisPlatform.w && lowerPointX2 > thisPlatform.x + thisPlatform.w)  ||
               (lowerPointX1 < thisPlatform.x && lowerPointX2 < thisPlatform.x ) ) {
         //       hero.save();
                this.platform = null;
            } else {
                this.adjustOnPlatform(thisPlatform);
                return;
            }
        }
        // cannot land while jumping.
        if (gravityDirection * this.vy < 0) {
            this.y +=dy;
            return;
        }
        // falling ? (and not standing) test if not landed.
        var platforms = this.owner.platforms;
        for (var i = 0; i < platforms.length; i++) {
            thisPlatform = platforms[i];
         //   if (! ( (thisPlatform instanceof Platform) /*|| (thisPlatform instanceof MovingPlatform)*/)) continue;
            if (thisPlatform.vSegmentIntersect(lowerPointX1, lowerPointY, lowerPointY+dy)
                || thisPlatform.vSegmentIntersect(lowerPointX2, lowerPointY, lowerPointY+dy)) {
                if (canWeLand( lowerPointY,  thisPlatform)) {
                    this.platform = thisPlatform;
                    this.jumping = false;
                    this.save();
                    this.adjustOnPlatform(thisPlatform);
                    playSound(SOUNDS.landed, 0, 12);
                    return;
                }
            }
        }
        this.y +=dy;
    };


    this.adjustOnPlatform = function(thisPlatform) {
        if (gravityDirection == 1.0) {
            this.y = thisPlatform.y - this.h;
        } else {
            this.y = thisPlatform.y + thisPlatform.h;
        }
    };

    this.flip = function () {
        this.vy = -2 * gravityDirection * vPunch;
        this.platform = null;
    };

    this.jump = function(playJumpSound) {
        if (playJumpSound===undefined) playJumpSound=true;
        this.platform = null;
        this.jumping = true;
        this.jumpTime = System.systemTime;
        this.vy = -gravityDirection * vPunch;
        if(playJumpSound) playSound(SOUNDS.jump, 0, 4);
    };

    this.handleInput = function () {
        var maxMiniJumpTime = 320;

        if (InputState[keys.UP] || InputState[keys.UP2]) {
            if (this.platform != null) {
              this.jump();
            } /* else if (System.systemTime - hero.jumpTime >= maxMiniJumpTime) {
                InputState[keys.UP] = InputState[keys.UP2] = false
            } */
        } else if (this.jumping && this.jumpTime && (System.systemTime - this.jumpTime < maxMiniJumpTime)) {
            this.jumpTime = 0;
            this.vy /= 4;
        }

        if (InputState[keys.LEFT]) {
            this.thrust = -maxThrust;
        } else if (InputState[keys.RIGHT]) {
            this.thrust = maxThrust;
        } else {
            this.thrust = 0;
        }

        if (InputState[keys.SPACE]) {
            this.color = 1 - this.color;
            InputState[keys.SPACE] = false;
        }
    }

    function canWeLand( oldY, thisPlatform) {
        if (gravityDirection > 0) {
            return oldY <= thisPlatform.y+0.05;
        } else {
            return oldY >= thisPlatform.y+ thisPlatform.h - 0.05 ;
        }
    }

}

// -----------------------------------

// -----------------------------------
//             Mountain
// -----------------------------------

function Mountain(baseY, amplitude, basePeriod, yEnd) {
    this.mountainGradient = createGradient([0, 0, 0, amplitude], [
        0, '#FFF',
        0.12, '#EEE',
        0.26, '#DDD',
        0.4, '#BBB',
        1, '#555']);
    this.endGradient = createGradient([0, amplitude, 0, yEnd - baseY], [
        0, '#555',
        1, '#000']);
    this.baseY = baseY;
    this.amplitude = amplitude;
    amplitude /= (1 + 0.8 + 0.16 + 0.18);
    var mainMountain = buildTriangleFunc(basePeriod, amplitude, 280);
    var secMountain = buildTriangleFunc(basePeriod * 0.52341247, amplitude * 0.8, 230);
    var spikes = buildTriangleFunc(basePeriod * 0.133479532, amplitude * 0.14, 10);
    var spikes2 = buildTriangleFunc(basePeriod * 0.174797531, amplitude * 0.12, 10, 15);
    this.mountainFunction = function (x) {
        return (mainMountain(x) + secMountain(x) + spikes(x) + spikes2(x));
    };
    this.draw = function (xOffset, yOffset) {
        xOffset = 0 | (xOffset || 0);
        yOffset = 0 | (yOffset || 0);
        var xMargin = 30;
        var mountainFunction = this.mountainFunction;
        var step = 30;
        var x = -xMargin;
        var xOR = xOffset % step;
        var xBase = xOffset - xOR;
        ctx.save();
        ctx.translate(-xOR - xMargin, this.baseY + yOffset);
        ctx.beginPath();
        ctx.moveTo(0, mountainFunction(xBase + x));
        for (; x < W + 2 * step; x += step) {
            ctx.lineTo(x, mountainFunction(x + xBase));
        }
        ctx.lineTo(x, this.amplitude);
        ctx.lineTo(0, this.amplitude);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle =  '#000';
        ctx.fillStyle = this.mountainGradient;
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = this.endGradient;
        ctx.fillRect(0, this.amplitude - 1, W + 2 * step - 1, yEnd - baseY + 1);
        ctx.restore();
    };

    function buildTriangleFunc(period, amp, phase) {
        var halfPeriod = period / 2;
        amp /= halfPeriod;
        phase = phase || 0;
        phase += period;
        return function (x) {
            x += phase;
            x = x % period;
            if (x > halfPeriod) x = period - x;
            return 0 | (x * amp);
        }
    }
}

// -----------------------------------
//             Platform
// -----------------------------------

/*

// feature dropped... not enough room...

function MovingPlatform(x1, y1, x2, y2, w, h, color, period, speed ) {
    Platform.call(this, x1, y1, w, h, color, period);
    x1 *= blockWidth;
    y1 *= blockHeight;
    x2 *= blockWidth;
    y2 *= blockHeight;
    this.x1 = x1;
    this.y1 = y1;
    this.dx = (x2 - x1);
    this.dy = (y2 - y1);
    this.speed = speed;
    this.period = period;
    var length = Math.sqrt(sq(this.dx) + sq(this.dy));
    this.dx /= length;
    this.dy /= length;
    this.vx = this.dx * speed;
    this.vy = this.dy * speed;
    this.direction = 1;
    this.lastPos = { x:0, y:0, vx:0, vy:0, direction:0};
    var superDraw = this.draw;
    this.draw = function () {
        superDraw.call(this);
    };
    var superUpdate = this.update;
    this.update = function (dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        var scl = (this.x - this.x1) * this.dx + (this.y - this.y1) * this.dy;
        if ((scl < 1) || (scl >= length)) {
            if (scl < 1) this.direction = 1;
            else if (scl >= length) this.direction = -1;
            this.vx = this.direction * this.dx * this.speed;
            this.vy = this.direction * this.dy * speed;
        }
        superUpdate.call(this);
    };

    this.save = function () {
        this.lastPos.x = this.x;
        this.lastPos.y = this.y;
        this.lastPos.vx = this.vx;
        this.lastPos.vy = this.vy;
        this.lastPos.direction = this.direction;
    };

    this.restore = function () {
        this.x = this.lastPos.x ;
        this.y = this.lastPos.y ;
        this.vx = this.lastPos.vx;
        this.vy = this.lastPos.vy;
        this.direction = this.lastPos.direction;
    };

    return this;
}

*/

// -----------------------------------
//             Platform
// -----------------------------------

var playingSound = -100;

function Platform(x, y, w, h, color, period) {
    BBox.call(this, x * blockWidth, y * blockHeight, w * blockWidth, h * blockHeight);
    this.color = color;
    this.period = period;
    this.colorSwitchTime = -1000;
    baseHue = color == 0 ? 259 : 346;

    var blinkTime = 500;
    var blinkPeriod= 250;
    var blinkHigh = 50;


    this.draw = function () {
        ctx.save();
        ctx.globalAlpha *= platformAlpha;
        ctx.translate(this.x, this.y);
        var filler = gradients[this.color];
        ctx.fillStyle = filler;
        //  if (typeof filler == )
        ctx.fillRect(0, 0, this.w, this.h );
        //       ctx.globalCompositeOperation = 'luminosity';
        //        ctx.fillStyle = gradients['o'+this.color]; // '#8FB';
        //      ctx.fillRect(0, 0, 1, 1);
        ctx.restore();

        ctx.strokeStyle = gradients.str;
        var lineWidth = 1.5;
        var blinking = false;
        var blinkingNow = false;

        if (this.period) {
            blinking =  (System.systemTime - this.colorSwitchTime >= this.period - blinkTime);
            if (blinking) {
                blinkingNow = dirac(0, 1, blinkHigh, blinkPeriod, System.sysNow, this.colorSwitchTime) > 0.5;
                if (blinkingNow && (System.systemTime - playingSound > 2 * blinkTime )) {
                    playingSound = System.systemTime;
                    playSound(SOUNDS.blip);
                    playSound(SOUNDS.blip, 0, 0, blinkPeriod/1000);
                   // playSound(SOUNDS.blip);

                }
            }
        }
        drawPlatformOutline(this.x + lineWidth, this.y + lineWidth,
                                this.w - 2*lineWidth, this.h - 2*lineWidth, lineWidth,
            blinkingNow);
    };

    this.update = function (dt) {
        if (this.period) {
            if (this.period && (System.systemTime - this.colorSwitchTime > this.period)) {
                this.color = 1 - this.color;
                this.colorSwitchTime = System.systemTime;
            }
        }
    };
    return this;
}

function drawPlatformOutline(x, y, w, h, lw, blinkingNow) {
    var olw = lw*5/2;

    if (blinkingNow) {
        ctx.strokeStyle  = '#EEE';
        ctx.lineWidth =olw;
        ctx.strokeRect(x, y, w, h);
        return;
    }

    ctx.strokeStyle  =  '#666';
    ctx.lineWidth = olw ;
    ctx.strokeRect(x, y, w, h);

    var ilw = lw;
    ctx.strokeStyle  = '#999';
    ctx.lineWidth = ilw ;
    //ctx.strokeRect(x,y,w,h);

    var hlw = lw / 2;
    ctx.strokeStyle  =  '#CCC';
    ctx.lineWidth =hlw;
    ctx.beginPath();
    ctx.moveTo(x - hlw, y - hlw);
    ctx.lineTo(x - hlw + w + olw, y - hlw);
    ctx.moveTo(x - hlw, y - hlw);
    ctx.lineTo(x - hlw, y - hlw + h);
    ctx.stroke();

    ctx.strokeStyle  = '#444';
    ctx.beginPath();
    ctx.moveTo(x - hlw, y - hlw + h);
    ctx.lineTo(x - hlw + w + olw, y - hlw + h);
    ctx.lineTo(x - hlw + w + olw, y - hlw);
    ctx.stroke();

}

function Star(x, y, s) {
    var hs = s / 2;
    var phase = 10 * Math.random();
    this.draw = function () {
        //	console.log(x,y,s);
        ctx.globalAlpha = 0.5 + osc ( 0, 0.5, 0.2); //0.5*Math.sin(0.02 * Date.now() * 0.06 + phase));
        ctx.fillStyle =  '#FF4';
        ctx.fillRect(x, y, s, s);

/*        ctx.strokeStyle  = '#FF4';
        ctx.lineWidth =  0.5*hs;
        ctx.beginPath();
        ctx.moveTo(x + hs, y - s);
        ctx.lineTo(x + hs, y + 2 * s);
        ctx.moveTo(x - s, y + hs);
        ctx.lineTo(x + 2 * s, y + hs);
        ctx.stroke();
*/    }
}

function drawStars(stars) {
    ctx.save();
    stars.forEach(function(x) {x.draw();});
    ctx.restore();
}

function buildStars(starCount, w, h, minSize, maxSize) {
    var stars = [];
    for (var i = 0; i < starCount; i++) {
        var newStar = new Star(w*Math.random(), h*Math.random(), minSize + (maxSize - minSize) * Math.random());
        stars.push(newStar);
    }
    return stars;
}
// -----------------------------------
//             Trigger
// -----------------------------------

//    ['msg', 1, 9, 16, 'use arrow keys ← ↑ → to move']

function Trigger(args) {
    BBox.call(this, args[1] * blockWidth, args[2] * blockHeight, args[3] * blockWidth, args[4] * blockHeight);
    //
    var type = args[0];
    if (type == 'msg') {
        // msg : x, y, w, h, txt, size, [ duration]
        this.txt = args[5];
        this.size = args[6];
        this.duration = args[7];
        this.draw = function() {
                };
    } else if (type == 'end') {
        this.direction = args[5];
       // var ligtherColor = '#555';
       // var ligtherColor2 = '#999';
        this.draw = function () {
          /*  ctx.save();
            ctx.translate(this.x, this.y);
            if (this.direction < 0) {
                ctx.translate(0, this.h);
                ctx.scale(1, -1);
            }*/
            // Green background
            ctx.save();
            ctx.globalAlpha *= 0.4 + osc(0,  0.7, 0.006);
            ctx.fillStyle =  '#9F9';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.restore();

            /*
            ctx.save();
            var circleRadius = 14;
            drawVLine(0         , 0, this.h, 10, colors[0]);
            drawVLine(this.w, 0, 0 + this.h, 10, colors[1]);
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#999';
            drawVLine( - 1, 0, 0 + this.h, 3, ligtherColor);
            drawVLine( this.w - 1, 0, this.h, 3, ligtherColor);
            ctx.globalCompositeOperation = 'source-over';
            drawCircle(0,0, circleRadius, colors[0]);
            drawCircle(this.w, 0, circleRadius, colors[1]);
            ctx.globalCompositeOperation =  'lighter';
            var smallerRadius = circleRadius/3;
            drawCircle(- smallerRadius, - smallerRadius, smallerRadius, ligtherColor2);
            drawCircle( this.w - smallerRadius,  - smallerRadius, smallerRadius, ligtherColor2);
            ctx.restore();
            */
            /// ctx.restore();
            if (dirac(0,1, 700, 800) > 0.5) {
                sft(26);
                ctx.fillStyle = '#000';
                ctx.fillText('EXIT', this.x + this.w/2, this.y + this.h/2);
            }
        };
        this.update = function () {
            var oh = this.overlaps(playScreen.hero);
            if (oh) {
                playScreen.currentLevel++;
                var scoreString = 'Level Score : ' + playScreen.levelScore() + '   ' + 'Score : ' + ( playScreen.score+playScreen.levelScore() ) ;
                if (playScreen.currentLevel == levels.length) {
                    // player did beat the game...
                    messageScreen.launch('You escaped !! Congratulations !!',scoreString,  1500, function() { System.launchScreen(titleScreen) });
                    playScreen.updateScore();
                } else {
                    // go to next level
                    messageScreen.launch('You escaped from level ' + (playScreen.currentLevel), scoreString,  1500, function() { System.launchScreen(playScreen) });
                    playScreen.updateScore();
                }
            }
        };
    } else if (type == 'flip') {

        var x = this.x, y=this.y, w=this.w, h=this.h;

        BBox.call(this, this.x+this.w/2.5, this.y, this.w/5, this.h);

        var flipTime = -1000;
        var angleDirection = args[5];
        var angle = ( args[5] == 1)  ? -Math.PI / 2 : Math.PI / 2;

        this.draw = function () {
            var amp = 0.1 * w;
            var dy = amp * Math.sin(0.006 * Date.now());
            drawArrow(x + w *0.05, y + dy - amp * angleDirection , w *0.55 , h, angle, null, '#F66', 3);
            drawArrow(x + w *0.5, y + dy - amp * angleDirection , w *0.55 , h, angle, null, '#F66', 3);
        };

        this.update = function () {
         //   if (angle*gravityDirection >0) return;
            if (System.systemTime - flipTime < 1200) return;
            if (this.overlaps(playScreen.hero)) {
                playScreen.hero.flip();
                flipTime = System.systemTime;
                gravityDirection *= -1;
                playSound(SOUNDS.reversing);
            }
        };
        /*

        function drawVLine(x, y1, y2, lw, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth =  lw;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x,y2);
            ctx.stroke();
        }
        function drawCircle(x,y,r,color) {
            ctx.beginPath();
            if (color) ctx.fillStyle = color;
            ctx.arc(x,y,r,0, 2*Math.PI);
            ctx.fill();
        }
        */

    }
}
hiscoreScreen = {};
// '!!! You Escaped !!!'

messageScreen = {
    launch: function (message1, message2, idleTime, callback) {
        this.message1 = message1;
        this.message2 = message2;
        this.idleTime  = idleTime;
        this.callback = callback;
        this.launchTime = System.systemTime;
        InputState[keys.SPACE] = false;
        System.currentScreen  = this;
    },
    draw: function () {
        var dt = System.systemTime - this.launchTime;
        var param = dt / this.idleTime;
        if (param > 1) param=1;
        erase();
        ctx.save();
        ctx.globalAlpha = Math.pow(Math.sin(Math.PI * 0.5 * (1 - param)), 1.3);
        playScreen.draw();
        ctx.restore();
        ctx.fillStyle = '#99F';
        sft(44);
        ctx.fillText(this.message1, W / 2, H / 2);
        sft(28);
        ctx.fillText(this.message2, W / 2, H / 2 + 56);
    },
    update: function (dt) {
        dt = System.systemTime - this.launchTime;
        if (dt > this.idleTime) {
            if (InputState[keys.SPACE]) {
                this.callback();
            }
        }
    },
    launchTime: 0
};

playScreen = (function() {

    var lifeParams = {
      x : 90,
        y: 20,
        scale : 2.05,
        h : 30,
        colorStops : [0, hsl(30, 80, 40), 1, hsl(60,80,70)],
        lifeGradient : null,
        lw: 4,
        strokeStyle : '#A00',
        ilw : 1,
        istrokeStyle : '#F00',
        fontSize : 28,
        txtX : 48,
        txtY : 35
    };

    var timeParams = {
        y : lifeParams.y + lifeParams.h /2,
        fontSize : 50,
        fillStyle : null
    };

    var _playScreen = {
        platforms: [],
        stillPlatforms: [],
        movingPlatforms: [],
        triggers: [],
        score : 0,

/*  saving space... :-)

 startLevel : 0,
    currentLevel: 0,
        levelTime : 0,
    timeLeft : 0,
    mountain: null,
    stars:null,
    hero:null,
    camera : null,
    buildings : null,
*/

    launch: function () {
        this.launchTime = System.systemTime;
        this.state = 0;
        this.stars = buildStars(25, W, 0.4*H, 1, 4);
        this.hero = new Hero(10, 0, heroWidth, heroHeight);
        this.hero.owner = this;
        this.camera = new Camera(0,0,W,H);
        var randomForBuildings = 100 + ( 0 | (100 * Math.random()));
        this.buildings = new Building( cityRelativeEnd * H, 60, cityRelativeHeight*H, W, randomForBuildings);
        lifeParams.lifeGradient = createGradient([lifeParams.x, lifeParams.y, 100*lifeParams.scale, lifeParams.h],
                       lifeParams.colorStops);
        timeParams.fillStyle = createGradient([0,timeParams.y-timeParams.fontSize/2, 0 , timeParams.y+timeParams.fontSize/2]
            , [0, '#FFF', 0.49, '#FFF',0.51, '#000', 1, '#000']);
        this.setupForLevel(this.currentLevel);
        if (this.currentLevel==0) this.score = 0;
        },
        updateScore : function() {
            this.score += this.levelScore();
        },
        levelScore : function() {
            return 0 | ( this.hero.life * 100 + 5 * ( this.levelTime -  ( System.systemTime - this.playerStartTime )));
        },

    draw: function () {
        var camera = this.camera;
        // sky
        fillBG();
        // stars
        drawStars(this.stars);
        // mountain
        this.mountain.draw(camera.x * 0.2, -camera.y * 0.01);
        //  drawBuildings
        this.buildings.draw(camera.x * cityRelativeSpeed);
        // -- In world --
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        // hero halo
        this.hero.drawColor();
        // platforms
        this.platforms.forEach(function(x) {if (x.overlaps(camera)) x.draw()} );
        // triggers
        this.triggers.forEach(function(x) {if (x.draw && x.overlaps(camera)) x.draw()} );
        // hero
        this.hero.draw();
        ctx.restore();
        // status : score, time, life, ...
        this.drawStatus();
        //
        if (this.state == 0 || this.state == 2) {
            var time = (this.state == 0) ?(this.launchTime) : this.fallTime;
            var rdt = (System.systemTime - time);
            rdt /=  (this.state == 0) ? levelStartDisplayTime : feltDisplayTime;
            var param = Math.pow(Math.sin(rdt * Math.PI), 0.7);
            ctx.fillStyle = '#FFF';
            var txt = (this.state == 0) ?'LEVEL ' + (this.currentLevel + 1) : 'Watch Out !!';
            ctx.fillText(txt, W * 0.5 - 40, H * param);
        }
    },
    update: function (dt) {
        var hero = this.hero;
        if (  this.state == 1 || this.state == 2) {
            this.timeLeft = this.levelTime -  ( System.systemTime - this.playerStartTime );
            if (this.timeLeft <=0) {
                this.timeLeft=0;
                messageScreen.launch('Game Over - Caught !! Time out !! -', 'Score : ' + playScreen.score,  2000, function() { System.launchScreen(titleScreen) });
            }
        }
        // Handle input if we are in 'play' state
        if (this.state == 1) {
            hero.handleInput(); // ...
            // Handle hero felt
            if (hero.y < - 4*blockHeight || hero.y > this.worldH + 4*blockHeight) {
                this.state = 2;
                hero.unfalling = System.systemTime;
                hero.restore();
                this.fallTime = System.systemTime;
                hero.standStill();
            }
        }
        // update platforms
        this.platforms.forEach(function(x) {x.update(dt)});
        // update hero
        hero.update(dt);

        // update triggers
        this.triggers.forEach(function(x) {x.update && x.update(dt)});

        this.camera.adjust(hero, dt);
        if ( this.state == 0 && System.systemTime - this.launchTime > levelStartDisplayTime) {
            this.state = 1;
            this.playerStartTime = System.systemTime;
        } else if (this.state == 2 && System.systemTime - this.fallTime > feltDisplayTime) {
            this.state = 1;
            hero.unfalling = 0;
        }
    },
    drawStatus: function () {
        //
        ctx.fillStyle = '#F00' ;
        sft(lifeParams.fontSize);
        ctx.textBaseline = 'middle';
        ctx.fillText('LIFE', lifeParams.txtX, lifeParams.txtY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeText('LIFE', lifeParams.txtX, lifeParams.txtY);
        // life bar
        ctx.save();
        roundRect(ctx, lifeParams.x, lifeParams.y, 100*lifeParams.scale, lifeParams.h, 8);
        ctx.save();
        ctx.clip();
        ctx.fillStyle = lifeParams.lifeGradient;
        ctx.fillRect(lifeParams.x, lifeParams.y, this.hero.life*lifeParams.scale, lifeParams.h );
        ctx.restore();
        ctx.strokeStyle = lifeParams.strokeStyle ;
        ctx.lineWidth = lifeParams.lw;
        if (this.hero.losingLife) {
            if (Math.floor(Date.now() / 200) % 2) {
                ctx.strokeStyle = '#FFF';
            }
        }
        ctx.stroke();
        ctx.strokeStyle = lifeParams.istrokeStyle ;
        ctx.lineWidth = lifeParams.ilw;
       ctx.stroke();
        ctx.restore();

        // -----  TIME   -----
        var timeLeft = 0 |  (( this.timeLeft + 500 ) / 1000 ) ;
        ctx.font = sft (timeParams.fontSize);
        ctx.fillStyle = timeParams.fillStyle;
        ctx.fillText(timeLeft,W/2, 35);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.strokeText(timeLeft,W/2, 35);

    },
    setupForLevel: function (levelIndex) {
        var hero = this.hero;
        var camera = this.camera;
        this.currentLevel = levelIndex;
        var i = 0;
        var level = levels[levelIndex];

        var worldW = 0;
        var worldH = 0;
        if (!level.dataLoaded) {
            decodeLevel(level, RSC['level'+(levelIndex+1)]);
        }
        var levelPlatforms = level.platforms;
        var heroPosition = level.heroPosition;
        hero.x = heroPosition.x * blockWidth;
        hero.y = heroPosition.y * blockHeight;
        //
        this.platforms.length = 0;
        for (i = 0; i < levelPlatforms.length; i++) {
            var thisPlatform = levelPlatforms[i];
            this.platforms.push(new Platform(
                thisPlatform[0],
                thisPlatform[1],
                thisPlatform[2],
                thisPlatform[3],
                thisPlatform[4],
                thisPlatform[5]));
            worldW = Math.max(worldW, thisPlatform[0] + thisPlatform[2]);
            worldH = Math.max(worldH, thisPlatform[1] + thisPlatform[3]);
        }
        /*
        this.movingPlatforms.length = 0;
        var levelMovingPlatforms = level.movingPlatforms;
        for (i = 0; i < levelMovingPlatforms.length; i++) {
            var thisMP = levelMovingPlatforms[i];
            var newMP = new MovingPlatform(
                thisMP[0], thisMP[1], thisMP[2], thisMP[3], thisMP[4], thisMP[5], thisMP[6], thisMP[7], thisMP[8]);
            this.movingPlatforms.push(newMP);
            this.platforms.push(newMP);
        }
        */

        //
        this.triggers.length = 0;
        var ts= this.triggers;
        level.triggers.forEach(function(x) { ts.push(  (x instanceof  Trigger) ? x : new Trigger(x) ); });

        // ----
        this.state = 0;
        this.worldW = worldW * blockWidth;
        this.worldH = worldH * blockHeight;
        camera.reset();
        //
        this.mountain = new Mountain(H / 4, H / 3, 2 * W / 3, H);
        //
        this.levelTime = this.timeLeft = level.timeToComplete;
        gravityDirection = 1.0;
        hero.reset();
    },

    launchTime: 0,
    playerStartTime: 0,
    state: 0
};

    return _playScreen;

})();

/**
 * Created by vincentpiel on 06/09/2015.
 */

titleScreen = (function() {

    var platformY = -1;
    var heroSpeed = 0.1 ;
    var hiScore = 0;
  //  var movingOn = true;
  //  var jumpingOver = null;
  //  var AfterJumpingOver = null;

    var _titleScreen = {
       /* stars: null,
        hero : null,
        mountains : null,
        camera : null,
        buildings : null,
        */
    //    platforms : [],

        launch: function () {
            hiScore  = Math.max ( +localStorage['hiScore'], +playScreen.score);
            localStorage['hiScore'] = hiScore;
            this.launchTime = System.systemTime;
            platformY = 0.65*H;
            this.stars = buildStars(46, W, 0.46*H, 1, 4);
            this.mountain = new Mountain(H / 6, H / 2,  W , cityRelativeEnd * H+cityRelativeHeight*H  +40);
           // this.hero = new Hero(10, platformY - 2 * heroHeight, heroWidth, heroHeight);
           // this.hero.platform = {};
          //  this.hero.owner = this;
            this.camera = new Camera(0,0,W,H);
            var randomForBuildings = 100 + ( 0 | (100 * Math.random()));
            this.buildings = new Building( cityRelativeEnd * H, 60, cityRelativeHeight*H, W, randomForBuildings);
            InputState[keys.SPACE] = false;
            // clearInputs();
      //      this.platforms.length = 0;
        },

        draw: function () {
            erase();
            drawStars(this.stars);
            var camera = this.camera;
            this.mountain.draw(camera.x * 0.2, -camera.y * 0.01);
            this.buildings.draw(camera.x * cityRelativeSpeed);
      //      ctx.save();
        //    ctx.translate(-camera.x, -camera.y);
  //          this.hero.drawColor();
/*            for (var i=0; i<this.platforms.length; i++) {
                var thisP = this.platforms[i];
                if (thisP.draw) thisP.draw();
            }
*/  //       this.hero.draw();
         //   ctx.restore();
            drawTitle();
            drawLowerText();
            ctx.fillText('High Score : ' + hiScore, W/2, 0.7 * H);
        },

        update: function (dt) {
           /// throw('rr')
            if (System.systemTime - this.launchTime > 1000) {
                if (InputState[keys.SPACE]) {
                    playScreen.currentLevel = 0;
                    System.launchScreen(playScreen);
                }
            }
            this.camera.x += heroSpeed * dt;
 /*            if (this.hero.x > W) {
                this.hero.x = -this.hero.w - 10;
                this.hero.color = 1 - this.hero.color;
            }
 */
          //  var hero = this.hero;
          //  var dx = hero.x - this.camera.x;
            /*
            if ( !hero.jumping) {
                var heroNextX = hero.x + 0.5*hero.w  ;
                var heroColor = hero.color;
                var nextPlatform = this.platforms.find( function(p) { return (heroNextX > p.x && heroNextX < p.x + p.w && heroColor != p.color); });
                AfterJumpingOver = this.platforms[this.platforms.indexOf(nextPlatform) +1];
                if (nextPlatform ) {
                    jumpingOver = nextPlatform;
                    if (nextPlatform.color !== undefined && nextPlatform.color != hero.color) hero.color = 1-hero.color;
                    hero.jump();
                }
            } else {
                if  (hero.x < AfterJumpingOver.x + AfterJumpingOver.w *0.3)
                    hero.thrust = maxThrust;
                else hero.thrust = 0;
            }
*/
           /* if (movingOn && !hero.jumping) {
                hero.thrust = maxThrust;
            }
            else if (!movingOn && !hero.jumping) hero.thrust =0;

            if (dx>0.4*W) movingOn = false;
            else if (dx<0.1*W) movingOn = true;
            else if (Math.random() > 0.90) movingOn = !movingOn;

            if (!hero.overlaps(this.camera))  {
                hero.x = this.camera.x + 10;
                hero.y = platformY - 2 * heroHeight;
            }
            hero.update(dt);
*/

//            this._updatePlatforms();
        },

/*        _updatePlatforms : function() {
            var needRemoving = [];
            var platforms = this.platforms;
            var camera = this.camera;
            platforms.forEach(function(p) { if (p.x+ p.w < camera.x ) needRemoving.push(p); });
            needRemoving.forEach(function(p) { remove( platforms, p ); });
            //
            var remLength = ( 2*W - this._getPlatformLength() );
            if (remLength <0 ) return;
            var startY = 0 | (platformY / blockHeight);
            var lastPlatform = this.platforms[this.platforms.length-1];
            do {
                //
                var platformType = 0; // 35/35/30 for Color 0/1/BBox
                var rnd = Math.random();
                if (rnd >0.7) platformType = 2;
                else if (rnd>0.35) platformType = 1;
                if (platformType == 2 && lastPlatform && (!  (lastPlatform instanceof Platform) )) platformType=1;
                //
                var startX = (lastPlatform) ? lastPlatform.x + lastPlatform.w : this.camera.x;
                startX = 0 | (startX / blockWidth);
                var platformLength = (platformType < 2) ?  ( 3 + ( 0 | ( 3 * Math.random())) )
                                                        :  ( 1 + ( 0 | (3*Math.random())) ) ;
                var newPlatform = (platformType < 2) ? new Platform(startX, startY, platformLength, 1, platformType, 0)
                                  : new BBox(startX*blockWidth, startY*blockHeight, platformLength*blockWidth, 1*blockHeight);
                //
                this.platforms.push(newPlatform);
                remLength -=  newPlatform.w;
                lastPlatform = newPlatform;
            } while (remLength > 0);
        },

        _getPlatformLength : function() {
            var totalLength = 0;
            this.platforms.forEach(function(x) { totalLength+= x.w });
            return totalLength;
        }*/
    };

    function drawLowerText() {
        var textColor = 'hsl(235, 80%, 80%)';

        var fontSize = 18;
        var vMargin = 3;
        var x = 0.5*W;
        var y = 0.8*H;
        sft(fontSize);
        ctx.fillStyle = textColor;
        drawText('The Monochromist party won in Flip red-blue city.');
        drawText('"We do not mix colors here", so they say.');
        drawText('Will you, a colorist rebel, escape from flip City in time ??');

        function drawText(txt) {
            ctx.fillText(txt, x, y);
            y+=fontSize + vMargin;
        }

        var sini = sinOsc(1, 0.02);

        var startText = System.isMobile ?
            'Touch the screen to play' :
            'Press space to play' ;
        fontSize = 16;
        ctx.fillStyle = (sini > 0) ? '#FFF' : '#AAA';
        sft(fontSize );
        ctx.fillText(startText, x, H - 2*fontSize);
    }

    function drawTitle() {
        var textColors = [
            hsl(235, 80, 20),
            hsl(350, 80, 12)];
        var yt = sinOsc(5, 0.06);
        var sini = + ( sinOsc(1, 0.02) > 0 );
        var hue1 = textColors[sini],
            hue2 = textColors[1-sini];

        glowText('ESCAPE', W/2, yt + 50 , 50, hue1);
        glowText('FROM', W/2, yt + 110 + yt/4, 30, hue1);
        glowText('FLIP CITY', W/2, 160 + yt, 50, hue2);

        glowText('By GameAlchemist', W/2, 210 + yt, 18, hue2);
    }

    return _titleScreen;

/*
    function remove(arr, element) {
        var index = arr.indexOf(element);
        if (index<0) return;
        arr.splice(index, 1);
    }
*/

})();






// -----------------------------------
//             Parameters
// -----------------------------------

// ---------    levels   -------------

var levels = [level1 , level2, level3];

// '(use arrow keys ← ↑ → to move and space bar to switch color)

var titleScreen;
var playScreen;
var hiscoreScreen;
var messageScreen;

// ----------------------------------

function main() {
    RSC['heroSpriteImg'+2] = turnRedToBlue(RSC['heroSpriteImg']);
    if (debug) {
        playScreen.currentLevel = startLevel;
        System.boot( playScreen );
    } else {
        System.boot(  titleScreen);
    }
    ctx.scale(scale, scale);
}

