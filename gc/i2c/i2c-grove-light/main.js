window.addEventListener("load", mainFunction, false);

async function mainFunction() {
  var head = document.getElementById("head");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var groveLight = new GROVELIGHT(port, 0x29);

  await groveLight.init();

  while (1) {
    try {
      var value = await groveLight.read();
      // console.log('value:', value);
      head.innerHTML = value ? value : head.innerHTML;
      await sleep(200);
    } catch (error) {
      console.log(" Error : ", error);
    }
  }
}
