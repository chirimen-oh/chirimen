main();

async function main() {
  var dist = document.getElementById("dist");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var vl = new VL53L0X(port, 0x29);
  await vl.init(); // for Long Range Mode (<2m) : await vl.init(true);
  for (;;) {
    var distance = await vl.getRange();
    dist.innerHTML = distance;
    await sleep(200);
  }
}
