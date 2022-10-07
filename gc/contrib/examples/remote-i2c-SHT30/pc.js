// Remote Example1 - controller

var channel;
onload = async function(){
	// webSocketリレーの初期化
	var relay = RelayServer("chirimentest", "chirimenSocket" );
	channel = await relay.subscribe("chirimenSHT");
	messageDiv.innerText="achex web socketリレーサービスに接続しました";
	channel.onmessage = getMessage;
}

function getMessage(msg){ // メッセージを受信したときに起動する関数
	var mdata = msg.data;
	messageDiv.innerText = JSON.stringify(mdata);
	console.log("mdata:",mdata);
	temTd.innerText = mdata.temperature;
	humTd.innerText = mdata.humidity;
}

function getData(){ // get microbit's internal sensor data
	channel.send("GET SENSOR DATA");
}
