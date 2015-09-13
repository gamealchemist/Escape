
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
