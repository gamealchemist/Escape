

function Building(startY, bw, bh, w, baseRand) {

    var buildingColor = '#333';
    var buildingRedColor = '#433';
    var buildingBlueColor = '#334';

    var endGradientStart = startY+bh-1;
    var endGd = createGradient([0,endGradientStart,0, H], [0, buildingColor, 1, '#000']);

    startY += bh;
    this.draw = function (startX) {
        var screenSizeInBlocks = 0 | ( w / bw );
        var startingBlock = 0 | (startX / bw);
        ctx.save();
        ctx.translate(-startX, startY);
        for (var i = startingBlock - 1; i <= startingBlock + screenSizeInBlocks + 1; i++) {
            drawBuilding(i, bw, bh, 0, baseRand);
        }
        ctx.restore();
        fillToEnd();
    };

    function drawBuilding(x, bw, bh, baseY, baseRand) {

        var r1 = (17159 * x + baseRand) % 569;
        var r2 = (16339 * x + baseRand) % 677;
        var r3 = (34963 * x + baseRand) % 2969;

        var bdWidth = 4 + (r1 % 5); // 4 --> 6
        var bdHeight = 3 + (r2 % 12) // 3 --> 14

        //ctx.fillStyle = buildingColor;
        ctx.fillStyle =  ((r1+r2 )%2) ? buildingRedColor : buildingBlueColor ;
        ctx.save();
        ctx.translate(x * bw, baseY - bh * bdHeight / 14);
        ctx.scale(bw * bdWidth / 6, bh * bdHeight / 14);
        ctx.fillRect(0, 0, 1, 1);

        var timeSlice = 4200 + (r3 % 6000);
        var timeZone = 0 | (Date.now() / timeSlice);
        var r4 = (7717 * x + baseRand + timeZone * 33641) % 5791;

        ctx.fillStyle = '#777700'; // #FFFF99
        var winCount = 0 | (r4 / 5791) * (0.2 * bdWidth * bdHeight);
        for (var i = 0; i < winCount; i++) {
            var xMargin = 0.2 / bdWidth;
            var yMargin = 0.15 / bdHeight;
            var wx = (r4 + ((i * 34217) % 1321)) % bdWidth;
            var wy = (r4 + ((i * 35141) % 1873)) % bdHeight;
            ctx.fillRect(wx / bdWidth + xMargin, wy / bdHeight + yMargin,
                1 / bdWidth - 2 * xMargin, 1 / bdHeight - 2 * yMargin);
        }
        ctx.restore();
    }

    function fillToEnd() {
        ctx.fillStyle = endGd ;
        ctx.fillRect(0,endGradientStart, W, H - endGradientStart);
    }
}