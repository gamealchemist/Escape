function drawImage(img, x,y,sw,sh,dw,dh,flipX, flipY, _index) {
    _index = _index || 0;
    var sx = 0;
    if (_index) sx += sw * _index;
    ctx.save();
    ctx.translate(x, y);
    if (flipX) {
        ctx.translate(dw , 0);
        ctx.scale(-1, 1);
    }
    if (flipY) {
        ctx.translate(0, dh );
        ctx.scale(1, -1);
    }
    ctx.drawImage(img, sx, 0, sw, sh, 0,0,dw, dh);
    ctx.restore();
}
