// -----------------------------------
//             Mountain
// -----------------------------------

function Mountain(baseY, amplitude, basePeriod, yEnd) {
    this.mountainGradient = createGradient([0, 0, 0, amplitude], [
        0, '#FFF',
        0.12, '#EEE',
        0.26, '#DDD',
        0.4, '#BBB',
        1, '#555']);
    this.endGradient = createGradient([0, amplitude, 0, yEnd - baseY], [
        0, '#555',
        1, '#000']);
    this.baseY = baseY;
    this.amplitude = amplitude;
    amplitude /= (1 + 0.8 + 0.16 + 0.18);
    var mainMountain = buildTriangleFunc(basePeriod, amplitude, 280);
    var secMountain = buildTriangleFunc(basePeriod * 0.52341247, amplitude * 0.8, 230);
    var spikes = buildTriangleFunc(basePeriod * 0.133479532, amplitude * 0.14, 10);
    var spikes2 = buildTriangleFunc(basePeriod * 0.174797531, amplitude * 0.12, 10, 15);
    this.mountainFunction = function (x) {
        return (mainMountain(x) + secMountain(x) + spikes(x) + spikes2(x));
    };
    this.draw = function (xOffset, yOffset) {
        xOffset = 0 | (xOffset || 0);
        yOffset = 0 | (yOffset || 0);
        var xMargin = 30;
        var mountainFunction = this.mountainFunction;
        var step = 30;
        var x = -xMargin;
        var xOR = xOffset % step;
        var xBase = xOffset - xOR;
        ctx.save();
        ctx.translate(-xOR - xMargin, this.baseY + yOffset);
        ctx.beginPath();
        ctx.moveTo(0, mountainFunction(xBase + x));
        for (; x < W + 2 * step; x += step) {
            ctx.lineTo(x, mountainFunction(x + xBase));
        }
        ctx.lineTo(x, this.amplitude);
        ctx.lineTo(0, this.amplitude);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle =  '#000';
        ctx.fillStyle = this.mountainGradient;
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = this.endGradient;
        ctx.fillRect(0, this.amplitude - 1, W + 2 * step - 1, yEnd - baseY + 1);
        ctx.restore();
    };

    function buildTriangleFunc(period, amp, phase) {
        var halfPeriod = period / 2;
        amp /= halfPeriod;
        phase = phase || 0;
        phase += period;
        return function (x) {
            x += phase;
            x = x % period;
            if (x > halfPeriod) x = period - x;
            return 0 | (x * amp);
        }
    }
}
