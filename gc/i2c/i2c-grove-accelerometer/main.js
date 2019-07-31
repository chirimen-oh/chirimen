"use strict";

window.addEventListener("load", mainFunction, false);

async function mainFunction() {
  var ax = document.getElementById("ax");
  var ay = document.getElementById("ay");
  var az = document.getElementById("az");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var groveAccelerometer = new GROVEACCELEROMETER(port, 0x53);
  await groveAccelerometer.init();

  while (1) {
    try {
      var values = await groveAccelerometer.read();
      ax.innerHTML = values.x ? values.x : ax.innerHTML;
      ay.innerHTML = values.y ? values.y : ay.innerHTML;
      az.innerHTML = values.z ? values.z : az.innerHTML;
    } catch (err) {
      console.log("READ ERROR:" + err);
    }

    await sleep(1000);
  }
}
