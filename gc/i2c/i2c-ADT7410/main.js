window.addEventListener("load", mainFunction, false);

async function mainFunction() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var adt7410 = new ADT7410(port, 0x48);
    await adt7410.init();
    while (1) {
      var value = await adt7410.read();
      // console.log('value:', value);
      head.innerHTML = value ? value : head.innerHTML;
      await sleep(1000);
    }
  } catch (error) {
    console.error("error", error);
  }
}
