// -----------------------------------
//             Parameters
// -----------------------------------

// ---------    levels   -------------

var levels = [level1 , level2, level3];

// '(use arrow keys ← ↑ → to move and space bar to switch color)

var titleScreen;
var playScreen;
var hiscoreScreen;
var messageScreen;

// ----------------------------------

function main() {
    RSC['heroSpriteImg'+2] = turnRedToBlue(RSC['heroSpriteImg']);
    if (debug) {
        playScreen.currentLevel = startLevel;
        System.boot( playScreen );
    } else {
        System.boot(  titleScreen);
    }
    ctx.scale(scale, scale);
}

