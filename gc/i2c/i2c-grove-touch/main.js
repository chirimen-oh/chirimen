'use strict';

window.addEventListener('load', function (){
  navigator.requestI2CAccess().then(function(i2cAccess) {
    var port = i2cAccess.ports.get(1);
    var touchSensor = new GroveTouch(port,0x5a);
    touchSensor.init().then(()=>{
      setInterval(()=>{
        touchSensor.read().then(ch => {
//            console.log(ch);
          document.getElementById("debug").innerHTML = JSON.stringify(ch);
        });
      },100);
    });
  }).catch(e=> console.error('error', e));
}, false);
