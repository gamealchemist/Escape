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





