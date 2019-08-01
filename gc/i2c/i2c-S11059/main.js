main();

async function main() {
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var s11059 = new S11059(port, 0x2a);
  await s11059.init();
  for (;;) {
    try {
      var values = await s11059.readR8G8B8();
      var red = values[0] & 0xff;
      var green = values[1] & 0xff;
      var blue = values[2] & 0xff;
      var gain_level = values[3];
      document.getElementById("sensor").textContent =
        "R:" + red + " G:" + green + " B:" + blue + " GAIN:" + gain_level;
      document.getElementById("color").style.backgroundColor =
        "rgb(" + red + ", " + green + "," + blue + ")";
    } catch (error) {
      console.log("READ ERROR:" + error);
    }
    await sleep(1000);
  }
}
