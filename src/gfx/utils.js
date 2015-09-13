function erase() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
}


function fillBG() {
    ctx.save();
    ctx.fillStyle = gradients.bg;
    ctx.scale(W, 0.55*H);
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
}

function createGradient(coords, stops) {
    var gd = ctx.createLinearGradient.apply(ctx, coords);
    for (var i = 0; i < stops.length; i += 2) {
        gd.addColorStop(stops[i], stops[i + 1]);
    }
    return gd;
}
function createZeroRadialGradients(coords, color, steps) {
    var stops=[0, '#000', 0, color, 1, '#000'];
    return createRadialGradients(coords, stops, steps);
}

function createRadialGradients(coords, stops, steps) {
    var res=[];
    var stepInv = 1 / ( steps + 1 );
    for(var i=1;i<=steps; i++) {
        stops[2]= stepInv * i;
        res.push(
            createRadialGradient(coords, stops)
        );
    }
    return res;
}

function createRadialGradient(coords, stops) {
    if (coords.length==3) {
        coords = [coords[0], coords[1], coords[2]]; // copy to avoid modifying reference...
        coords.push(coords[0], coords[1], coords[2]);
        coords[2] = 0; // ... like here...
    }
    var gd = ctx.createRadialGradient.apply(ctx, coords);
    for (var i = 0; i < stops.length; i += 2) {
        gd.addColorStop(stops[i], stops[i + 1]);
    }
    return gd;
}