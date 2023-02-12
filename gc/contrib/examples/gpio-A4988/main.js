// ステッピングモーターコントローラA4988を使ってステッピングモーターをコントロールする
// ステッピングモーターは停止状態でも通電され加熱するので火傷に要注意！
let portAddrs = [26, 19]; // ステッピングモーターコントローラA4988をつなぐGPIOポート番号
let ports = [];

let steps = 100;

main();

async function main() {
	// ポートを初期化するための非同期関数
	console.log("main");
	var gpioAccess = await navigator.requestGPIOAccess(); // thenの前の関数をawait接頭辞をつけて呼び出します。

	for (let i = 0; i < 2; i++) {
		ports[i] = gpioAccess.ports.get(portAddrs[i]);
		await ports[i].export("out");
	}
	for (let i = 0; i < 2; i++) {
		await ports[i].write(0);
	}
}

async function fwd(){
	await stepMove(steps, 0);
}
async function rev(){
	await stepMove(steps, 1);
}

function setSteps(){
	steps = stepsInput.value;
	spepVal.innerText="steps:"+steps;
}

async function stepMove(steps, direction) {
	console.log("start move:",steps,direction);
	await ports[1].write(direction);
	for (let i = 0; i < steps; i++) {
		await ports[0].write(1);
		await sleep(1);
		await ports[0].write(0);
		await sleep(20);
	}
	console.log("completed move:");
}
