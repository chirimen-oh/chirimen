"use strict";

var valelem;
window.addEventListener(
  "load",
  function() {
    valelem = document.getElementById("distance");
    mainFunction();
  },
  false
);

async function mainFunction() {
  var sensor_unit;
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    sensor_unit = new GP2Y0E03(port, 0x40);
    await sensor_unit.init();

    while (1) {
      try {
        var distance = await sensor_unit.read();
        if (distance != null) {
          valelem.innerHTML = "Distance:" + distance + "cm";
        } else {
          valelem.innerHTML = "out of range";
        }
      } catch (err) {
        console.log("READ ERROR:" + err);
      }
      await sleep(500);
    }
  } catch (err) {
    console.log("GP2Y0E03 init error");
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
