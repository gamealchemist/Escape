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

