
var debug = false;
var showTouch = false ; // && debug;
var startLevel = 1;

var gradients = {};

var ratio = 4/3 ;
var canvasWidth = 640;
var canvasHeight = 0 | (  canvasWidth / ratio ) ;
// var imageSmoothingEnabled = true;

var scale = 0.85;


// ---------  Game Parameters   -------------
var blockWidth = 72;
var blockHeight = 40;

var camXMargin = 40,
    camYMargin = 100;

var heroWidth = 40;
var heroHeight = 60;
var heroSpriteWidth = 32;
var heroSpriteHeight = 32;
var gravity = 0.0025;
var gravityDirection = 1;
var vPunch = 0.80;
var friction = 0.145;
var maxThrust = 0.0034;
var maxVSpeed = 0.68;
var lifeLooseSpeed = 0.2/16;

var levelStartDisplayTime = 2000;
var feltDisplayTime = 800;
// var wonGameDisplayTime = 4000;

var platformAlpha = 0.85;

var cityRelativeEnd = 0.4;
var cityRelativeHeight = 0.35;
var cityRelativeSpeed = 0.4;

var timeSpeed = 0.95;

// Colors
var hueColors = [ 0, 240 ];
var colors = [ hsl(hueColors[0], 80, 55 ) , hsl(hueColors[1], 80, 55 ) ];

var RSC = {
    heroSpriteImg : addRsc(Image, 'skaterb.png')
    ,level1 : addRsc(Image, 'level1.png')
  ,level2 : addRsc(Image, 'level2.png')
    ,level3 : addRsc(Image, 'level3.png')
//    ,level4 : addRsc(Image, 'rsc/level4.bmp')
};

