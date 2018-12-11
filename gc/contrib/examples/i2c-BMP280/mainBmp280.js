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
		var bmp280 = new BMP280(port, 0x76);
		await bmp280.init();
		while (1) {
			var val = await bmp280.readData();
			temp.innerHTML=val.temperature;
			pres.innerHTML=val.pressure;
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
