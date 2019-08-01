var rawData = [];
var voltage = [];
window.addEventListener(
  "load",
  function() {
    for (var i = 0; i < 4; i++) {
      rawData[i] = document.getElementById("rawData" + i);
      voltage[i] = document.getElementById("voltage" + i);
    }
    console.log("init0:", rawData, voltage);
    main();
  },
  false
);

async function main() {
  // Initialize WebI2C
  var i2cAccess = await navigator.requestI2CAccess();
  try {
    var port = i2cAccess.ports.get(1);
    var ads1115 = new ADS1x15(port, 0x48);
    await ads1115.init(true);
    console.log("new");
    while (1) {
      try {
        for (var i = 0; i < 4; i++) {
          var value = await ads1115.read(i);
          rawData[i].innerHTML = "ch" + i + ":" + value.toString(16);
          voltage[i].innerHTML = ads1115.getVoltage(value).toFixed(4) + "V";
        }
      } catch (error) {
        console.log(error);
      }
      await sleep(100);
    }
  } catch (error) {
    console.log("ADS1115.init error" + error);
  }
}
