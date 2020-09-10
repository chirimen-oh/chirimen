// Remote Example1 - controller

var channel;
onload = async function(){
	// webSocketリレーの初期化
	var relay = RelayServer("achex", "chirimenSocket" );
	channel = await relay.subscribe("chirimenHBridge");
	messageDiv.innerText="achex web socketリレーサービスに接続しました";
	channel.onmessage = getMessage;
}

function getMessage(msg){ // メッセージを受信したときに起動する関数
	messageDiv.innerText = msg.data;
}

function FWD(){ // MOTOR FWD
	channel.send("MOTOR FWD");
}
function REV(){ // MOTOR REV
	channel.send("MOTOR REV");
}
function STOP(){ // MOTOR OFF
	channel.send("MOTOR OFF");
}
