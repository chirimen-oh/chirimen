'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  head.innerHTML = "started";
  navigator.requestI2CAccess().then((i2cAccess)=> {
    head.innerHTML = "initializing...";
    var port = i2cAccess.ports.get(1);
    var disp = new OledDisplay(port);
    disp.init().then(async ()=>{
      disp.initQ();
      disp.clearDisplayQ();
      await disp.playSequence();
      head.innerHTML = "drawing text...";
      disp.drawStringQ(0,0,"hello");
      disp.drawStringQ(1,0,"Real");
      disp.drawStringQ(2,0,"World");
      await disp.playSequence();
      head.innerHTML = "completed";
    });
  }).catch((e)=>{
    console.error('I2C bus error!', e);
    head.innerHTML = e;
  });
}, false);