window.addEventListener(
  "load",
  function() {
    var head = document.getElementById("head");
    navigator
      .requestI2CAccess()
      .then(i2cAccess => {
        var port = i2cAccess.ports.get(1);
        var cz = new canzasi(port, 0x30);
        var v = 0;
        cz.init().then(function() {
          setInterval(function() {
            v ^= 1;
            cz.set(v);
          }, 500);
        });
      })
      .catch(e => console.error("error", e));
  },
  false
);
