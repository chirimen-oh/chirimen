"use strict";

var head;
window.addEventListener(
  "load",
  function() {
    head = document.querySelector("#head");
    mainFunction();
  },
  false
);

async function mainFunction() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var mpu6050 = new MPU6050(port, 0x68);
    await mpu6050.init();
    while (1) {
      var val = await mpu6050.readAll();
      // console.log('value:', value);
    	temp.innerHTML=val.temperature;
    	gx.innerHTML=val.gx;
    	gy.innerHTML=val.gy;
    	gz.innerHTML=val.gz;
    	rx.innerHTML=val.rx;
    	ry.innerHTML=val.ry;
    	rz.innerHTML=val.rz;
      await sleep(1000);
    }
  } catch (error) {
    console.error("error", error);
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
