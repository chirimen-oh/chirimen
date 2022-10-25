main();

async function main() {
	try {
		var temp = document.getElementById("temp");
		var humi = document.getElementById("humi");
		var co2ppm = document.getElementById("co2ppm");

		var i2cAccess = await navigator.requestI2CAccess();
		var port = i2cAccess.ports.get(1);
		var scd40 = new SCD40(port, 0x62);
		await scd40.init();
		console.log(await scd40.serial_number());
		await scd40.start_periodic_measurement();

		while (1) {
			var data = await scd40.getData();
			temp.innerText=data.temperature;
			humi.innerText=data.relative_humidity;
			co2ppm.innerText=data.co2;
			console.log(data);
			await sleep(1000);
		}
	} catch (error) {
		console.error("error", error);
	}
}
