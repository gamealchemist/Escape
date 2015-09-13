function glowText(txt, x, y, fontSize, txtHue) {
    sft( fontSize );
    var far = 1000;
    var dx = 6;
    ctx.save();
    ctx.fillStyle='#FFF';
    ctx.globalAlpha = 0.9;

    ctx.shadowColor =  hsl(235, 85, 95);
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = scale * (far - 4 - 2 * Math.random()); // !! canvas bug, scale is forgotten !!
    ctx.shadowOffsetY = scale * ( -4 +  Math.random());

    ctx.fillText(txt, x - far, y);
    ctx.fillText(txt, x - far, y);

    ctx.shadowColor = hsl(350, 75, 85);
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = scale * ( far + dx + 2 * Math.random()) ; // !! canvas bug, scale is forgotten !!
    ctx.shadowOffsetY = scale * ( dx +  Math.random() );
    ctx.fillText(txt, x - far, y);
    ctx.fillText(txt, x - far, y);

    ctx.globalAlpha = 1;
    ctx.shadowColor = null;
    ctx.fillStyle = txtHue;
    ctx.fillText(txt, x, y);
    ctx.restore();
}