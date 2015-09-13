
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
