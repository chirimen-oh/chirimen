main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var vl = new VL53L1X(port);
    await vl.init("short"); // Ranging mode: short, medium, long
  	await vl.startContinuous();
    while (1) {
      var dat = await vl.read();
      document.getElementById("distance").innerHTML = dat + "[mm]";
      await sleep(400);
    }
  } catch (error) {
    console.error("error", error);
  }
}

