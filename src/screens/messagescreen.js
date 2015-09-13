// '!!! You Escaped !!!'

messageScreen = {
    launch: function (message1, message2, idleTime, callback) {
        this.message1 = message1;
        this.message2 = message2;
        this.idleTime  = idleTime;
        this.callback = callback;
        this.launchTime = System.systemTime;
        InputState[keys.SPACE] = false;
        System.currentScreen  = this;
    },
    draw: function () {
        var dt = System.systemTime - this.launchTime;
        var param = dt / this.idleTime;
        if (param > 1) param=1;
        erase();
        ctx.save();
        ctx.globalAlpha = Math.pow(Math.sin(Math.PI * 0.5 * (1 - param)), 1.3);
        playScreen.draw();
        ctx.restore();
        ctx.fillStyle = '#99F';
        sft(44);
        ctx.fillText(this.message1, W / 2, H / 2);
        sft(28);
        ctx.fillText(this.message2, W / 2, H / 2 + 56);
    },
    update: function (dt) {
        dt = System.systemTime - this.launchTime;
        if (dt > this.idleTime) {
            if (InputState[keys.SPACE]) {
                this.callback();
            }
        }
    },
    launchTime: 0
};