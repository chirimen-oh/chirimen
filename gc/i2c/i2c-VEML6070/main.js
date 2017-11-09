'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  
  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var veml6070 = new VEML6070(port);
    veml6070.init().then(()=>{
      setInterval(()=>{
        veml6070.read().then((value)=>{
//            console.log('value2:', value);
          head.innerHTML = value;
        });
      },200);
    });
  }).catch(e=> console.error('error', e));
}, false);
