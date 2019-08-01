window.addEventListener("load", mainFunction, false);

async function mainFunction() {
  try {
    var temp = document.getElementById("temp");
    var pres = document.getElementById("pres");
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var bmp280 = new BMP280(port, 0x76);
    await bmp280.init();
    while (1) {
      var val = await bmp280.readData();
      temp.innerHTML = val.temperature;
      pres.innerHTML = val.pressure;
      await sleep(1000);
    }
  } catch (error) {
    console.error("error", error);
  }
}
