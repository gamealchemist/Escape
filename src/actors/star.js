
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