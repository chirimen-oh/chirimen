// Remote Example1 - reciever
// for CHIRIMEN with:microbit

var microBitBle;
var channel;
var pca9685;

main();

async function main(){
	// chirimen with micro:bit、サーボコントローラの初期化
	var i2cAccess = await navigator.requestI2CAccess();
	var i2cPort = i2cAccess.ports.get(1);
	pca9685 = new PCA9685(i2cPort, 0x40);
	await pca9685.init(0.001, 0.002, 30);
	
	
	// webSocketリレーの初期化
	var relay = RelayServer("achex", "chirimenSocket" );
	channel = await relay.subscribe("chirimenMbitRemoteServo");
	msgDiv.innerText="achex web socketリレーサービスに接続しました";
	channel.onmessage=moveServo;
}

async function moveServo(message) {
//	console.log("message:",message);
	if ( !message.data.slope){
		return;
	}
	var angle = message.data.slope;
	if ( Math.abs(angle)>28){
		angle = Math.sign(angle)*28;
	}
	console.log("servo:",angle);
    await pca9685.setServo(0, angle);
    msgDiv.innerHTML = "サーボ角度:"+angle;
	channel.send({setAngle:angle});
}
