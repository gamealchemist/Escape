
var InputState = [];

var keys = {
    LEFT: 37,
    UP: 38,
    UP2 : 40,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32
};

function clearInputs() {
    for (var k in keys) {
        InputState[keys[k]] = false;
    }
}
