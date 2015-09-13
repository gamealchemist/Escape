function clamp(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

function sq(x) {
    return x * x;
}

function sinOsc(amp, freq, clock) {
    clock = clock || Date.now ;
    return amp * Math.sin(freq * 0.06 * clock());
}

function osc(min, max, freq, clock) {
    clock = clock || Date.now ;
    var hAmp = (max - min) / 2;
    return min + hAmp * ( 1 + Math.sin(freq * 0.06 * clock()));
}

function dirac(min, max, highPeriod, totalPeriod, clock, startTime) {
    clock = clock || Date.now ;
    startTime = startTime || 0;
    var t = ( (clock() - startTime) % totalPeriod ) ;
    if (t<highPeriod) return max;
    else return min;
}
