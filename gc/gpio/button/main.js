'use strict';

var ledPort,switchPort; // LEDとスイッチの付いているポート

window.addEventListener('load', function (){
	initGPIO();
}, false);


function ledOnOff(v){
	if(v === 0){
		ledPort.write(0);
	} else {
		ledPort.write(1);
	}
}

async function initGPIO(){
	var gpioAccess = await navigator.requestGPIOAccess();
	ledPort = gpioAccess.ports.get(26); // LEDのPort
	await ledPort.export("out");
	switchPort = gpioAccess.ports.get(5); // タクトスイッチのPort
	await switchPort.export("in");
	switchPort.onchange = function(val){
		// Port 5の状態を読み込む  
		val ^= 1; // switchはPullupなのでOFFで1。LEDはOFFで0なので反転させる
		ledOnOff(val);
	}
}
