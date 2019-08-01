// Hブリッジモータードライバは正転[1,0]・逆転[0,1]・ブレーキ[1,1]・フリー[0,0]の4状態を
// GPIOの２つの信号線を使って指示します
// PCA9685のPWMによって速度をさらにコントロールします。
var portAddrs = [20, 21]; // HブリッジコントローラをつなぐGPIOポート番号
var portPromise;
var pca9685pwmPromise;

main();

async function main() {
  // ポートを初期化するための非同期関数
  try {
    console.log("main");
    var gpioAccess = await navigator.requestGPIOAccess(); // thenの前の関数をawait接頭辞をつけて呼び出します。
    var ports = [];
    var i2cAccess = await navigator.requestI2CAccess();
    var i2cPort = i2cAccess.ports.get(1);
    var pca9685pwm = new PCA9685_PWM(i2cPort, 0x40);
    await pca9685pwm.init(100);
    for (var i = 0; i < 2; i++) {
      ports[i] = gpioAccess.ports.get(portAddrs[i]);
      await ports[i].export("out");
    }
    for (var i = 0; i < 2; i++) {
      ports[i].write(0);
    }
    portPromise = ports;
    pca9685pwmPromise = pca9685pwm;
  } catch (error) {
    console.error("error", error);
  }
}

async function pwm(ratio) {
  var pca9685pwm = await pca9685pwmPromise;
  await pca9685pwm.setPWM(0, ratio);
}

async function free() {
  var ports = await portPromise;
  ports[0].write(0);
  ports[1].write(0);
}

async function brake() {
  var ports = await portPromise;
  ports[0].write(1);
  ports[1].write(1);
  await sleep(300); // 300ms待機してフリー状態にします
  ports[0].write(0);
  ports[1].write(0);
}

async function fwd() {
  var ports = await portPromise;
  ports[0].write(1);
  ports[1].write(0);
}

async function rev() {
  var ports = await portPromise;
  ports[0].write(0);
  ports[1].write(1);
}
