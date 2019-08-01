main();

async function main() {
  try {
    var temp = document.getElementById("temp");
    var pres = document.getElementById("pres");
    var humi = document.getElementById("humi");
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    // BME280 の SlaveAddress 初期値はモジュールによって異なる
    // var bme280 = new BME280(port, 0x76);
    var bme280 = new BME280(port, 0x77);
    await bme280.init();
    while (1) {
      var val = await bme280.readData();
      temp.innerHTML = val.temperature;
      pres.innerHTML = val.pressure;
      humi.innerHTML = val.humidity;
      await sleep(1000);
    }
  } catch (error) {
    console.error("error", error);
  }
}
