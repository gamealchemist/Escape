// -----------------------------------
//             Colors
// -----------------------------------

function setupStandardGradient() {
    gradients = {
        0: createPlatformGradient(hueColors[0]),
        /*        createGradient([0, 0, 0, 1], [0, '#844',
         0.5, '#F88',
         1, '#844']),
         */
        1:  createPlatformGradient(hueColors[1]),
        /* createGradient([0, 0, 0, 1], [0, '#5B7595',
         0.5, '#9CACC1',
         1, '#5B7595']),*/

        o0: createGradient([0, 0, 1, 0], [0, '#844',
            0.5, '#F88',
            1, '#844']),

        o1: '#9F8',

        str: '#242',

        bg: createGradient([0, 1, 0, 0],
            [0, hsl(195, 100, 10),
            1, hsl(195, 100, 40)])
    };
}

/*
function setupGreenGradient() {
    gradients = {
        0: '#D66',
        1: '#66D',
        str: '#0B0',
        bg: '#000'
    };
}

    */