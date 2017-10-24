'use strict';

window.addEventListener('load', function (){
  navigator.requestGPIOAccess().then(
    function(gpioAccess){
      console.log("GPIO ready!");
      return gpioAccess;
    }).then(gpio=>{
      var port = gpio.ports.get(5);
      port.export("in").then(()=>{
        setInterval(()=>{
          port.read().then((value)=>{
            console.log("gpio= "+value);
          });
        },1000);
      });
  }).catch(error=>{
    console.log("Failed to get GPIO access catch: " + error.message);
  });
}, false);
