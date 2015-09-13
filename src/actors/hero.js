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
