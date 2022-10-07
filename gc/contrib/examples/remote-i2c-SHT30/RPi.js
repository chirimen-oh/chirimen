var channel;
var port;

main();

async function main() {
	// I2Cポートと、I2CデバイスSHT30の初期化
	var i2cAccess = await navigator.requestI2CAccess();
	var i2cPort = i2cAccess.ports.get(1);
	sht = new SHT30(i2cPort);
	await sht.init();
	
	// webSocketリレーの初期化
	var relay = RelayServer("chirimentest", "chirimenSocket" );
	channel = await relay.subscribe("chirimenSHT");
	msgDiv.innerText="achex web socketリレーサービスに接続しました";
	channel.onmessage = transmitSensorData;
}

async function transmitSensorData(messge){
	msgDiv.innerText=messge.data;
	if ( messge.data =="GET SENSOR DATA"){
		var sensorData = await readData();
		channel.send(sensorData);
		msgDiv.innerText=JSON.stringify(sensorData);
	}
}

async function readData(){
	var shtData = await sht.readData();
	console.log('shtData:', shtData);
	msgDiv.innerHTML= "temperature:" + shtData.temperature + "degree  <br>humidity:"+ shtData.humidity + "%";
	return(shtData);
}
