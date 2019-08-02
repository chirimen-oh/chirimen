main();

async function main() {
  var ax = document.getElementById("ax");
  var ay = document.getElementById("ay");
  var az = document.getElementById("az");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var groveaccelerometer = new GROVEACCELEROMETER(port, 0x53);
  await groveaccelerometer.init();
  for (;;) {
    try {
      var values = await groveaccelerometer.read();
      ax.innerHTML = values.x ? values.x : ax.innerHTML;
      ay.innerHTML = values.y ? values.y : ay.innerHTML;
      az.innerHTML = values.z ? values.z : az.innerHTML;
    } catch (err) {
      console.log("READ ERROR:" + err);
    }
    await sleep(1000);
  }
}
