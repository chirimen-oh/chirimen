'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  
  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var grovelight = new GROVELIGHT(port,0x29);
    grovelight.init().then(()=>{
      setInterval(()=>{
        grovelight.read().then((value)=>{
//            console.log('value:', value);
          head.innerHTML = value ? value : head.innerHTML;
        });
      },200);
    });
  }).catch(e=> console.error('error', e));
}, false);
