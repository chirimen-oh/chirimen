'use strict';

window.addEventListener('load', function (){
  navigator.requestGPIOAccess().then(gpioAccess=>{
    var port = gpioAccess.ports.get(26);
    var v = 0;
    return port.export("out").then(()=>{
      setInterval(function(){
        v = v ? 0 : 1;
        port.write(v);
      },1000);
    });
  });
}, false);
