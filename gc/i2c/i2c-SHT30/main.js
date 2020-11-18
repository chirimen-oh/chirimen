main();

async function main() {
  const temperatureDisplay = document.getElementById("temperatureDisplay");
  const humidityDisplay = document.getElementById("humidityDisplay");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const sht30 = new SHT30(port, 0x44);
  await sht30.init();

  while (true) {
    const { humidity, temperature } = await sht30.readData();
    temperatureDisplay.innerHTML = `${temperature.toFixed(2)} ℃`;
    humidityDisplay.innerHTML = `${humidity.toFixed(2)} %`;
    await sleep(500);
  }
}
