"use strict";

window.addEventListener('load', function (){
  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var sensor_unit = new GP2Y0E03(port,0x40);
    var valelem = document.getElementById("distance");
    sensor_unit.init().then(()=>{
      setInterval(()=>{
        sensor_unit.read().then((distance)=>{
          if(distance != null){
            valelem.innerHTML = "Distance:"+distance+"cm";
          }else{
            valelem.innerHTML = "out of range";
          }
        }).catch(function(reason) {
          console.log("READ ERROR:" + reason);
        });
      },500);

    },(err)=>{
      console.log("GP2Y0E03 init error");
    });
  });
}, false);
