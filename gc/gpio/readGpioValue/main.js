'use strict';

window.addEventListener('load', function (){
	mainFunction();
}, false);

async function mainFunction(){
	var gpioAccess = await navigator.requestGPIOAccess();
	console.log("GPIO ready!");
	var port = gpioAccess.ports.get(5);
	await port.export("in");
	while ( true ){
		var value = await port.read();
		console.log("unixtime:"+new Date().getTime()+ "  gpio(5)= " + value);
		await sleep(500);
	}

};

function sleep(ms){
	return new Promise( function(resolve) {
		setTimeout(resolve, ms);
	});
}
