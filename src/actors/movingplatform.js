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
