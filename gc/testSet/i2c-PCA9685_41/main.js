'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  
  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var pcs9685 = new PCA9685(port,0x41);
    var angle = 90;
//      console.log("angle"+angle);
    //servo setting for sg90
    pcs9685.init(0.00050,0.00240,180).then(()=>{
      setInterval(()=>{
        angle = (angle<=10) ? 170 : 10;
//        console.log("angle"+angle);
        pcs9685.setServo(0,angle).then(()=>{
//          console.log('value:', angle);
          head.innerHTML = angle;
        });
      },1000);
    });
  }).catch(e=> console.error('error', e));
}, false);
