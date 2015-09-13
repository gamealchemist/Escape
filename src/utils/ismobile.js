
function isMobile() {
    var mobileMatch = /iphone|ipod|ipad|android|ie|blackberry|fennec|mobile/i;
    return navigator.userAgent.toLowerCase().match(mobileMatch);
}
