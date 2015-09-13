// -----------------------------------
//             BBox
// -----------------------------------

function BBox(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.overlaps = function (other) {
        return !((this.x > other.x + other.w) || (this.x + this.w < other.x) || (this.y > other.y + other.h) || (this.y + this.h < other.y));
    };
    this.pointInside = function (x, y) {
        if (gravityDirection>0)
           return (x >= this.x) && (x < this.x + this.w) && (y >= this.y) && (y < this.y + this.h);
        else
            return (x > this.x) && (x <= this.x + this.w) && (y > this.y) && (y <= this.y + this.h);
    };
    this.vSegmentIntersect = function (x, y1, y2) {
        if ((x < this.x) || (x >= this.x + this.w)) return false;
        if ((y2 >= this.y) && (y2 < this.y + this.h)) return true;
        var compareAgainst = this.y;
        if (y1 > y2) compareAgainst += this.h;
        return (compareAgainst - y1) * (compareAgainst - y2) <= 0;
    };
}