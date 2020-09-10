// Remote Example1 - controller

var channel;
onload = async function(){
	// webSocketリレーの初期化
	var relay = RelayServer("achex", "chirimenSocket" );
	channel = await relay.subscribe("chirimenSW");
	messageDiv.innerText="achex web socketリレーサービスに接続しました";
	channel.onmessage = getMessage;
}

function getMessage(msg){ // メッセージを受信したときに起動する関数
	var txt;
	if ( msg.data.indexOf("ON")>0){
		txt="リモートスイッチがオン";
	} else {
		txt="リモートスイッチがオフ";
	}
	messageDiv.innerText = msg.data + "  "+ txt;
}

