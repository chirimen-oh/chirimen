var channel;
var LEDport, SWport;

main();

async function main() {
	var relay = RelayServer("chirimentest", "chirimenSocket" );
	channel = await relay.subscribe("chirimenSW");
	document.getElementById("message").innerText="connected : achex : chirimenSocket : chirimenSW";
	
	var gpioAccess = await navigator.requestGPIOAccess(); // GPIO を操作する
	LEDport = gpioAccess.ports.get(26); // 26 番ポートを操作する
	await LEDport.export("out"); // ポートを出力モードに設定
	
	SWport = gpioAccess.ports.get(5); // タクトスイッチの付いているポート
	await SWport.export("in");
	
	SWport.onchange = transmitSW;
}

function transmitSW(val){
	if ( val == 0 ){
		channel.send("SWITCH ON");
		LEDport.write(1);
		console.log("ON");
		document.getElementById("message").innerText="スイッチがオンになりました";
	} else {
		channel.send("SWITCH OFF");
		LEDport.write(0);
		console.log("OFF");
		document.getElementById("message").innerText="スイッチがオフになりました";
	}
}
