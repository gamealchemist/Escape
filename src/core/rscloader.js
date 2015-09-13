// resources loader
(function setupLoader() {

//    window.AnyFile = XMLHttpRequest;

    var rscCount = 1;
 //   var errorCount = 0;
    //var errMsgs = '';

    window.addRsc = function (rscType, rscUrl) {
        var rsc = new rscType();
        rscCount++;
        rsc.addEventListener('load', loadEnded)
        //      rsc.addEventListener('error', errorWhileLoading);
//        if (rscType !== AnyFile)
            rsc.src = rscUrl;
//        else {
//            rsc.open("GET", rscUrl, true);
//            rsc.send(null);
//        }
        return rsc;
    };

    window.addEventListener('load', loadEnded);

    function loadEnded() {
        rscCount--;
        if (!rscCount) launchMain();
    }
/*
    function errorWhileLoading(e) {
        errorCount++;
        rscCount--;
        errMsgs +=  e.src + ' '  + e.message + '\n';
        if (!rscCount) launchMain();
    }
    */

    function launchMain() {
//        if (errorCount) alert('errors while loading rsc : \n' + errMsgs);
        main();
    }
})();
