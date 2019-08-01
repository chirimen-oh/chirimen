main();

async function main() {
  var head = document.getElementById("head");
  head.innerHTML = "started";
  var i2cAccess = await navigator.requestI2CAccess();
  head.innerHTML = "initializing...";
  var port = i2cAccess.ports.get(1);
  var gesture = new PAJ7620(port, 0x73);
  await gesture.init();

  for (;;) {
    var v = await gesture.read();
    head.innerHTML = v;
    await sleep(1000);
  }
}
