main();

async function main() {
  var head = document.getElementById("head");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var grovelight = new GROVELIGHT(port, 0x29);
  await grovelight.init();
  for (;;) {
    try {
      var value = await grovelight.read();

      head.innerHTML = value ? value : head.innerHTML;
    } catch (error) {
      console.log(" Error : ", error);
    }
    await sleep(200);
  }
}
