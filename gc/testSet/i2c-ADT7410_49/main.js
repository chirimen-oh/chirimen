"use strict";

window.addEventListener("load", mainFunction, false);

async function mainFunction() {
  var head = document.getElementById("head");

  navigator
    .requestI2CAccess()
    .then(i2cAccess => {
      var port = i2cAccess.ports.get(1);
      var adt7410 = new ADT7410(port, 0x49);
      adt7410.init().then(() => {
        setInterval(() => {
          adt7410.read().then(value => {
            //          console.log('value:', value);
            head.innerHTML = value ? value : head.innerHTML;
          });
        }, 1000);
      });
    })
    .catch(e => console.error("error", e));
}
