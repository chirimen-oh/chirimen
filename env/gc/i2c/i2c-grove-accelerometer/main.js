'use strict';

window.addEventListener('load', function (){
  var ax = document.querySelector('#ax');
  var ay = document.querySelector('#ay');
  var az = document.querySelector('#az');
  
  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var groveaccelerometer = new GROVEACCELEROMETER(port,0x53);
    groveaccelerometer.init().then(()=>{
      setInterval(()=>{
        groveaccelerometer.read().then((values)=>{
//          console.log('values(x,y,z):', values.x,values.y,values.z);
          ax.innerHTML = values.x ? values.x : ax.innerHTML;
          ay.innerHTML = values.y ? values.y : ay.innerHTML;
          az.innerHTML = values.z ? values.z : az.innerHTML;
        });
      },1000);
    });
  }).catch(e=> console.error('error', e));
}, false);