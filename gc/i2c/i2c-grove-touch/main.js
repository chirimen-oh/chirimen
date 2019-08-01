main();

async function main() {
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var touchSensor = new GroveTouch(port, 0x5a);
  await touchSensor.init();
  for (;;) {
    var ch = await touchSensor.read();
    document.getElementById("debug").innerHTML = JSON.stringify(ch);
    await sleep(100);
  }
}
