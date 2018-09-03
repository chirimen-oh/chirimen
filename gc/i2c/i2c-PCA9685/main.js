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
  var i2cAccess = await navigator.requestI2CAccess();
  try {
    var port = i2cAccess.ports.get(1);
    var pcs9685 = new PCA9685(port, 0x40);
    var angle = 90;
    // console.log("angle"+angle);
    // servo setting for sg90
    await pcs9685.init(0.0005, 0.0024, 180);
    while (1) {
      angle = angle <= 10 ? 170 : 10;
      // console.log("angle"+angle);
      await pcs9685.setServo(0, angle);
      // console.log('value:', angle);
      head.innerHTML = angle;
      await sleep(1000);
    }
  } catch (e) {
    console.error("error", e);
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
