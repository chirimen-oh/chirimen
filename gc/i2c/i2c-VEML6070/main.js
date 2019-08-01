main();

async function main() {
  var head = document.getElementById("head");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var veml6070 = new VEML6070(port);
  await veml6070.init();
  for (;;) {
    var value = await veml6070.read();
    // console.log('value2:', value);
    head.innerHTML = value;
    await sleep(200);
  }
}
