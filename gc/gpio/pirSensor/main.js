'use strict';

navigator.requestGPIOAccess().then((gpioAccess)=>{
  var sensor = document.getElementById('sensor');
  var dPort = gpioAccess.ports.get(12);
  return Promise.all([dPort.export("in")]).then(()=>{
    dPort.onchange = function(v){
      if(v === 1){
        sensor.innerHTML = "ON";
      }else{
        sensor.innerHTML = "OFF";
      }
    }
  });
});
