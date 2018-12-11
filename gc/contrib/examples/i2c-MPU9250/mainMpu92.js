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
    var mpu6500 = new MPU6500(port, 0x68);
    var ak8963 = new AK8963(port, 0x0c);
    await mpu6500.init();
    await ak8963.init();
    while (1) {
      var val0 = await mpu6500.getAcceleration();
      var val1 = await mpu6500.getGyro();
      var val2 = await ak8963.readData();
      // console.log('value:', value);
    	gx.innerHTML=val0.x;
    	gy.innerHTML=val0.y;
    	gz.innerHTML=val0.z;
    	rx.innerHTML=val1.x;
    	ry.innerHTML=val1.y;
    	rz.innerHTML=val1.z;
    	hx.innerHTML=val2.x;
    	hy.innerHTML=val2.y;
    	hz.innerHTML=val2.z;
      await sleep(600);
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
