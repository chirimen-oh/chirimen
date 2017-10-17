'use strict';

window.addEventListener('load', function (){
  navigator.requestGPIOAccess().then(
    function(gpioAccess) {
//        console.log("GPIO ready!");
      return gpioAccess;
    }).then(gpio=>{
      var ledPort = gpio.ports.get(26);
      var buttonPort = gpio.ports.get(5);
      return Promise.all([
        ledPort.export("out"),
        buttonPort.export("in")
      ]).then(()=>{
        buttonPort.onchange = function(v){
//          console.log("button is pushed!");
          v = v ? 0 : 1;
          ledPort.write(v);
        }
      });
  }).catch(error=>{
    console.log("Failed to get GPIO access catch: " + error.message);
  });
}, false);
