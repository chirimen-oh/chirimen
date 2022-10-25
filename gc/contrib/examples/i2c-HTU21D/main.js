main();

async function main() {
	try {
		var temp = document.getElementById("temp");
		var pres = document.getElementById("pres");
		var i2cAccess = await navigator.requestI2CAccess();
		var port = i2cAccess.ports.get(1);
		var htu21d = new HTU21D(port);
		await htu21d.init();
		while (1) {
			var temperature = await htu21d.readTemperature();
			var humidity = await htu21d.readHumidity();
			temp.innerHTML = temperature;
			humi.innerHTML = humidity;
			await sleep(1000);
		}
	} catch (error) {
		console.error("error", error);
	}
}
