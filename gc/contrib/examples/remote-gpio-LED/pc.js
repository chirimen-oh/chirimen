// Remote Example1 - controller

var channel;
onload = async function(){
	// webSocketリレーの初期化
	var relay = RelayServer("achex", "chirimenSocket" );
	channel = await relay.subscribe("chirimenLED");
	messageDiv.innerText="achex web socketリレーサービスに接続しました";
	channel.onmessage = getMessage;
}

function getMessage(msg){ // メッセージを受信したときに起動する関数
	messageDiv.innerText = msg.data;
}

function OnLED(){ // LED ON
	channel.send("LED ON");
}
function OffLED(){ // LED OFF
	channel.send("LED OFF");
}
