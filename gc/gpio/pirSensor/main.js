'use strict';
onload=function (){
	mainFunction();
}

async function mainFunction(){
	var gpioAccess = await navigator.requestGPIOAccess();
	var sensor = document.getElementById('sensor');
	var dPort = gpioAccess.ports.get(12);
	await dPort.export("in");
	dPort.onchange = function(v){
		if(v === 1){
			sensor.innerHTML = "ON";
		}else{
			sensor.innerHTML = "OFF";
		}
	}
};
