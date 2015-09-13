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