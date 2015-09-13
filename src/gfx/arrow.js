function drawArrow(x, y, w, h, angle, fillStyle, strokeStyle, lineWidth) {
    var aw = w / 8;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.translate(-w / 2, -h / 2);
    ctx.moveTo(2 * w / 3, h * (1 - 1 / 5));
    ctx.lineTo(w, h / 2);
    ctx.lineTo(2 * w / 3, h * (1 / 5));
    ctx.lineTo(2 * w / 3, h / 2 - aw);
    ctx.lineTo(0, h / 2 - aw);
    ctx.lineTo(0, h / 2 + aw);
    ctx.lineTo(2 * w / 3, h / 2 + aw);
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth || 4;
        ctx.stroke();
    }
    ctx.restore();
}
