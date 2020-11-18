main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var sht = new SHT30(port);
    await sht.init();
    while (1) {
      var data = await sht.readData();
      document.getElementById("temperature").innerHTML = data.temperature.toFixed(2) + "degree";
      document.getElementById("humidity").innerHTML = data.humidity.toFixed(2) + "%";
      await sleep(200);
    }
  } catch (error) {
    console.error("error", error);
  }
}

