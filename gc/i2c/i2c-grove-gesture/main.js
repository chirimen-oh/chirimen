main();

async function main() {
  var head = document.querySelector("#head");
  head.innerHTML = "started";
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    head.innerHTML = "initializing...";
    var port = i2cAccess.ports.get(1);
    var gesture = new PAJ7620(port, 0x73);
    await gesture.init();
    // console.log("gesture.init done");

    while (1) {
      var v = await gesture.read();
      head.innerHTML = v;
      await sleep(1000);
    }
  } catch (error) {
    console.error("I2C bus error!", error);
    head.innerHTML = error;
  }
}
