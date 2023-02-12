var channel;
var portAddrs = [20,21];
var ports = [];

main();

async function main() {
  var relay = RelayServer("chirimentest", "chirimenSocket");
  channel = await relay.subscribe("chirimenHBridge");
  document.getElementById("message").innerText =
    "connected :  : chirimenSocket : chirimenHBridge";
  channel.onmessage = controlMotor;

  var gpioAccess = await navigator.requestGPIOAccess(); // GPIO を操作する
  for (var i = 0; i < 2; i++) {
    ports[i] = gpioAccess.ports.get(portAddrs[i]);
    await ports[i].export("out");
  }
  for (var i = 0; i < 2; i++) {
    ports[i].write(0);
  }
}

function controlMotor(msg) {
  document.getElementById("message").innerText = msg.data;
  if (msg.data == "MOTOR FWD") {
    fwd();
    console.log("FWD");
    channel.send("モーターを正転します");
  } else if (msg.data == "MOTOR REV") {
    rev();
    console.log("REV");
    channel.send("モーターを逆転します");
  } else if (msg.data == "MOTOR OFF") {
    free();
    console.log("OFF");
    channel.send("モーターをオフにしす");
  }
}

async function free() {
  ports[0].write(0);
  ports[1].write(0);
}

async function fwd() {
  ports[0].write(1);
  ports[1].write(0);
}

async function rev() {
  ports[0].write(0);
  ports[1].write(1);
}
