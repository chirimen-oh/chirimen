"use strict";

var head;
window.addEventListener(
	"load",
	function() {
		head = document.querySelector("#head");
		mainFunction();
	},
	false
);

async function mainFunction() {
	try {
		var i2cAccess = await navigator.requestI2CAccess();
		var port = i2cAccess.ports.get(1);
		var bme280 = new BME280(port, 0x77);
		await bme280.init();
		while (1) {
			var val = await bme280.readData();
			temp.innerHTML=val.temperature;
			pres.innerHTML=val.pressure;
			humi.innerHTML=val.humidity;
			await sleep(1000);
		}
	} catch (error) {
		console.error("error", error);
	}
}

function sleep(ms) {
	return new Promise(function(resolve) {
		setTimeout(resolve, ms);
	});
}
