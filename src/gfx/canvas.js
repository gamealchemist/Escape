
// creates and returns a canvas having provided width, height
function createCanvas ( w, h ) {
    var newCanvas = document.createElement('canvas');
    newCanvas.width  = w;     newCanvas.height = h;
    return newCanvas;
}

function buildShadow (image, fillStyle) {
    var newCanvas = createCanvas(image.width, image.height) ;
    var newCtx= newCanvas.getContext('2d');
    newCtx.save();
    newCtx.fillStyle = fillStyle ;
    newCtx.fillRect(0,0,newCanvas.width, newCanvas.height);
    newCtx.globalCompositeOperation='destination-in';
    newCtx.drawImage(image,0,0);
    newCtx.restore();
    return newCanvas;
}

function buildImageData(img) {
    var cv =  createCanvas(img.width, img.height);
    var ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0,0,img.width, img.height);
}

function turnRedToBlue(img) {
    var id =  buildImageData(img);
    var d = id.data;
d[50]=10;
    for (var i=0; i< d.length-100; i+=4 ) {
        if ( d[i+2] > 250 ) {
            d[i]    = 255;
            d[i+1]=0;
            d[i+2] = 0;
            d[i+2]  = 0;
           }
    }
    id.data = d;

    var c = createCanvas(img.width, img.height);
     c.getContext('2d').putImageData(id,0,0);
    return c;
}