/* Convention :
An RGB Point of the image is understood as a 3 bit value. 0 -> 0 255 -> 1.
1 -> Platform Color 0
1 -> Platform Color 1
3 -> Blinking Platform Color 0
4 -> Blinking Platform Color 1
5 -> End of level
6 -> trajectory of moving platforms.
7 -> Gravity Switch

For convenience, the first 7 points of the image keeps the 7
possibles colors, so they are skipped.
 */

function decodeLevel(level, img) {
    var imgWidth = img.width;
    var data = (buildImageData(img)).data;
    var data2 = (buildImageData(img)).data;

    level.platforms = [];

    var i=0;

    // retrieve platforms and End of Level.
  for ( i=7*4; i<data.length; i+=4) {
      var decoded = decodeData(data, i);
      if (!decoded) continue;
      if (decoded < 7) {
          var w = getPlatformLength(data, decoded, i);
          var h = getPlatformHeight(data, w, decoded, i);
          var pi = i >> 2;
          var x = pi % imgWidth;
          var y = ( pi - x ) / imgWidth;
          if (decoded <5) {
              // still or moving platform
              var blinking = decoded >=3 ;
              var color = (decoded - 1) & 1 ;
              level.platforms.push([x , y , w, h, color, (+blinking) * level.platformPeriod]);
          } /* else if (decoded == 6) {
              // direction for moving platforms
              platformsDirections.push([x , y , w, h ]);
          } */ else if (decoded == 5) {
              // end of level
              level.triggers.push(new Trigger(['end', x , y , w, h, findEndSwitchDirection(x,y) ]));
          }
      } else if (decoded == 7) {
          addGravitySwitch( level,  { x: (i >> 2) % imgWidth, y: ( 0 | ((i>>2)/imgWidth)) } );
      }
  }
    // dispatch what has been found in platforms / movingPlatforms / End switch.

    // level.movingPlatforms=[];
/*    for (i=0; i<rawPlatforms.length; i++) {
        var thisP = rawPlatforms[i];
        updateIfIsAMovingPlatform(thisP, platformsDirections);
        if (thisP.length == 6) {

        } else {
            level.movingPlatforms.push(thisP);
        }
    }
*/
    level.dataLoaded = true;

    // return;

    // -----------------------------------------------------------------

    function findEndSwitchDirection(x,y) {
        var pos = ((y-1)*imgWidth + x)<<2;
        if (decodeData(data2, pos)) return -1;
        return 1;
    }


    function addGravitySwitch(level, switchCoords) {
        var dir =1;
        var pos = ((switchCoords.y-1)*imgWidth + switchCoords.x)<<2;
        if (decodeData(data2, pos)) dir *=-1;
        level.triggers.push(new Trigger([ 'flip', switchCoords.x, switchCoords.y, 1, 1, dir ]));
    }

    /*
    function updateIfIsAMovingPlatform(platform, directions) {
        var i=0;
        var isMoving = false;
        var x2 = platform[0];
        var y2 = platform[1];
        for ( i=0; i<directions.length; i++) {
            var thisTraj = directions[i];
            // above the first pixel ?
            if (thisTraj[0] == platform[0] && thisTraj[1] + thisTraj[3] == platform[1] ) {
                isMoving = true;
                y2 -=thisTraj[3];
            } else // After the last h pixel
            if (thisTraj[1] == platform[1] && platform[0] + platform[2] == thisTraj[0]  )  {
                isMoving = true;
                x2+=thisTraj[2];

            }
        }
        if (isMoving) {
            platform.splice(2, 0, x2, y2);
            platform.push(level.platformSpeed);
        }
    }
    */

    function getPlatformLength(data, color, index ) {
        var length = 0;
        do {
            index+=4;
            length++;
        } while (index < data.length && decodeData(data, index) == color);
        return length;
    }

    function getPlatformHeight(data, width,  color, index ) {
        var height = 0;
        do {
          clearLine(data, width, index);
          index+=imgWidth*4;
          height++;
       } while (index < data.length && decodeData(data, index) == color);
        return height;
    }

    function decodeData(data, index) {
        return  ( (data[index]>192) ? 4 : 0 ) +
         ( (data[index+1]>192) ? 2 : 0 ) +
         ( (data[index+2]>192) ? 1: 0 );
    }

    function clearLine(data, width, index) {
        var endLine = index + width*4
        for (; index<endLine; index+=4) clearData(data, index);
    }

    function clearData(data, index) {
        data[index] = data[index+1] = data[index+2] = 0;
    }
}