// Hブリッジモータードライバは正転[1,0]・逆転[0,1]・ブレーキ[1,1]・フリー[0,0]の4状態を
// GPIOの２つの信号線を使って指示します
var portAddrs = [20,21]; // HブリッジコントローラをつなぐGPIOポート番号
var portPromise;

onload =async function(){ // ポートを初期化するための非同期関数
  console.log("onload");
  var gpioAccess = await navigator.requestGPIOAccess(); // thenの前の関数をawait接頭辞をつけて呼び出します。
  var ports = [];
  
  for ( var i = 0 ; i < 2 ; i++ ){
    ports[i] = gpioAccess.ports.get(portAddrs[i]);
    await ports[i].export("out");
  }
  for ( var i = 0 ; i < 2 ; i++ ){
    ports[i].write(0);
  }
  portPromise = ports;
}

async function free(){
  var ports = await portPromise;
  ports[0].write(0);
  ports[1].write(0);
}

async function brake(){
  var ports = await portPromise;
  ports[0].write(1);
  ports[1].write(1);
  await sleep(300); // 300ms待機してフリー状態にします
  ports[0].write(0);
  ports[1].write(0);
}

async function fwd(){
  var ports = await portPromise;
  ports[0].write(1);
  ports[1].write(0);
}

async function rev(){
  var ports = await portPromise;
  ports[0].write(0);
  ports[1].write(1);
}

// 単に指定したms秒スリープするだけの非同期処理関数
// この関数の定義方法はとりあえず気にしなくて良いです。コピペしてください。
function sleep(ms){
  return new Promise( function(resolve) {
    setTimeout(resolve, ms);
  });
}

