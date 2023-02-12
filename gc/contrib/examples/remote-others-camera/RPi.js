var channel;
var port;

onload=function(){
	main();
}

async function main() {
	tinyCamera.init(400,300, true); // 画像サイズ(px正方形),プレビュー画面サイズ(px正方形),継続撮影モード)
	var relay = RelayServer("chirimentest", "chirimenSocket" );
	channel = await relay.subscribe("chirimenCAM");
	msgDiv.innerText=" web socketリレーサービスに接続しました";
	channel.onmessage = transmitImageData;
}

function transmitImageData(messge){
	console.log(messge.data);
	if (messge.data == "GET IMAGE DATA") {
		const imageURI = tinyCamera.getImage();
		var sensorData = {
			imageURI: imageURI,
			time: new Date().getTime(),
		};
		channel.send(sensorData);
		console.log("Send ImageData: length:", JSON.stringify(sensorData).length);
		msgDiv.innerText="画像を送信します。";
		setTimeout(function(){msgDiv.innerText="";},1000);
	}
}
