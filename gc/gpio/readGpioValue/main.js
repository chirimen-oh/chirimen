main();

async function main() {
  var gpioAccess = await navigator.requestGPIOAccess();
  console.log("GPIO ready!");
  var port = gpioAccess.ports.get(5);
  await port.export("in");
  while (true) {
    var value = await port.read();
    console.log("unixtime:" + new Date().getTime() + "  gpio(5)= " + value);
    await sleep(500);
  }
}
