main();

async function main() {
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var ads1015 = new ADS1015(port, 0x48);
  await ads1015.init();
  console.log("new");
  for (;;) {
    try {
      var value = await ads1015.read(0);
      console.log("value:", value);
      head.innerHTML = value;
    } catch (error) {
      if (error.code != 4) {
        head.innerHTML = "ERROR";
      }
      console.log("error: code:" + error.code + " message:" + error.message);
    }
    await sleep(100);
  }
}
