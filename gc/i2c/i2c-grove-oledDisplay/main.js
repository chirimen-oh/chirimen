main();

async function main() {
  var head = document.getElementById("head");
  head.innerHTML = "started";
  var i2cAccess = await navigator.requestI2CAccess();
  head.innerHTML = "initializing...";
  try {
    var port = i2cAccess.ports.get(1);
    var display = new OledDisplay(port);
    await display.init();
    display.clearDisplayQ();
    await display.playSequence();
    head.innerHTML = "drawing text...";
    display.drawStringQ(0, 0, "hello");
    display.drawStringQ(1, 0, "Real");
    display.drawStringQ(2, 0, "World");
    await display.playSequence();
    head.innerHTML = "completed";
  } catch (error) {
    console.error("I2C bus error!", error);
    head.innerHTML = error;
  }
}
