// Remote Camera Example - controller

window.takeImage = takeImage;

var channel;
onload = async function () {
	// webSocketリレーの初期化
	var relay = RelayServer("chirimentest", "chirimenSocket");
	channel = await relay.subscribe("chirimenCAM");
	messageDiv.innerText = "web socketリレーサービスに接続しました";
	channel.onmessage = getImage;
};

function getImage(msg) {
	// メッセージを受信したときに起動する関数
	var mdata = msg.data;
	console.log("mdata:", mdata);
	document.getElementById("remoteImage").src = mdata.imageURI;
	var capTime = new Date(mdata.time);
	document.getElementById("timeTD").innerText = "撮影時刻: " + capTime.toLocaleString();
}

function takeImage() {
	// get microbit's internal sensor data
	channel.send("GET IMAGE DATA");
}
