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