
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
