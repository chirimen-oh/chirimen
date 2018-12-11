// Hブリッジモータードライバの二本の制御端子にそれぞれPCA9685のPWM信号を入力し正逆転と速度コントロールをします。
var pca9685pwmPromise;

onload =async function(){ // ポートを初期化するための非同期関数
	try{
		console.log("onload");
		var i2cAccess = await navigator.requestI2CAccess();
		var i2cPort = i2cAccess.ports.get(1);
		var pca9685pwm = new PCA9685_PWM(i2cPort, 0x40);
		await pca9685pwm.init(100);
		pca9685pwmPromise = pca9685pwm;
	} catch (error) {
		console.error("error", error);
	}
}

var direction = 1;
var ratio = 0;

async function speed(speedVal){
	ratio = speedVal;
	await setMotor();
}


async function setMotor(){
	var pca9685pwm = await pca9685pwmPromise;
	if ( direction == 1 ){
		await pca9685pwm.setPWM(1,0);
		await pca9685pwm.setPWM(0,ratio);
	} else if ( direction == -1 ){
		await pca9685pwm.setPWM(0,0);
		await pca9685pwm.setPWM(1,ratio);
	} else {
		await pca9685pwm.setPWM(0,0);
		await pca9685pwm.setPWM(1,0);
	}
}


async function stop(){
	direction = 0;
	await setMotor();
}

async function fwd(){
	direction = 1;
	await setMotor();
}

async function rev(){
	direction = -1;
	await setMotor();
}

// 単に指定したms秒スリープするだけの非同期処理関数
// この関数の定義方法はとりあえず気にしなくて良いです。コピペしてください。
function sleep(ms){
	return new Promise( function(resolve) {
		setTimeout(resolve, ms);
	});
}

