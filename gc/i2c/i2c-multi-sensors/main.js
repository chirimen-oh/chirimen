main();

async function main() {
  var head1 = document.getElementById("head1");
  var head2 = document.getElementById("head2");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var groveLight = new GROVELIGHT(port, 0x29);
  var adt7410 = new ADT7410(port, 0x48);
  await groveLight.init();
  await adt7410.init();

  for (;;) {
    try {
      var lightValue = await groveLight.read();
      head1.innerHTML = lightValue;
    } catch (error) {
      console.log("groveLight error:" + error);
    }

    try {
      var tempValue = await adt7410.read();
      head2.innerHTML = tempValue;
    } catch (error) {
      console.log("adt7410 error:" + error);
    }
    sleep(500);
  }
}
