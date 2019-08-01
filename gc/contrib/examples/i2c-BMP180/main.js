window.addEventListener("load", main, false);

async function main() {
  try {
    var temp = document.getElementById("temp");
    var pres = document.getElementById("pres");
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var bmp180 = new BMP180(port, 0x77);
    await bmp180.init();
    while (1) {
      var temperature = await bmp180.readTemperature();
      temp.innerHTML = temperature;
      var pressure = await bmp180.readPressure();
      pres.innerHTML = pressure;
      await sleep(1000);
    }
  } catch (error) {
    console.error("error", error);
  }
}
