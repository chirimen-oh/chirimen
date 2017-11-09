'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  head.innerHTML = "started";
  navigator.requestI2CAccess().then(function(i2cAccess) {
    head.innerHTML = "initializing...";
    var port = i2cAccess.ports.get(1);
    var gesture = new PAJ7620(port,0x73);
    gesture.init().then(function(){
//      console.log("gesture.init done");
      setInterval(function(){
        gesture.read().then(function(v){
          head.innerHTML = v;
        });
      },1000);
    },function(v){
      console.log("init error:v[0]="+v[0]+" v[1]="+v[1]);
      head.innerHTML = "PAJ7620 initialization faild!";
    });  
  }).catch(function(e){
    console.error('I2C bus error!', e);
    head.innerHTML = e;
  });
}, false);