function createPlatformGradient(baseHue) {
    var cv2 = document.createElement('canvas');
    cv2.width = cv2.height = 64;
    var ctx2 = cv2.getContext('2d');

    var cw = 0.15;

    var c1= hsl(baseHue, 65, 40);
    var c2= hsl(baseHue, 75,45);
    var c3 = hsl(baseHue, 90, 65);
    var c4 = hsl(baseHue, 100, 80);

    var gd = createGradient([0, 0, 64, 64], [
        0, c1,
        0.25 - cw - 0.01, c2,
        0.25 - cw, c3,
        0.25, c4,
        0.25 + cw, c3,
        0.25 + cw + 0.01, c2,
        0.5  , c1,
        0.75 - cw - 0.01, c2,
        0.75 - cw, c3,
        0.75, c4,
        0.75 + cw, c3,
        0.75 + cw + 0.01, c1,
        1, c1]);

    ctx2.fillStyle = gd;
    ctx2.fillRect(0, 0, 64, 64);

    return ctx.createPattern(cv2, "repeat");
}

function hsl(h, s, l) {
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}