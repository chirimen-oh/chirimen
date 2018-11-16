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
		var bmp180 = new BMP180(port, 0x77);
		await bmp180.init();
		while (1) {
			var temperature = await bmp180.readTemperature();
			temp.innerHTML=temperature;
			var pressure = await bmp180.readPressure();
			pres.innerHTML=pressure;
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
