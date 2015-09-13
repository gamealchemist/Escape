function setupKeys() {
    window.addEventListener('keydown', function (e) {
        var keyCode = e.keyCode || e.which;
        InputState[keyCode] = true;
        e.stopPropagation();
        e.preventDefault();
    }, false);
    window.addEventListener('keyup', function (e) {
        var keyCode = e.keyCode || e.which;
        InputState[keyCode] = false;
    }, false);
}
