'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  
  navigator.requestI2CAccess().then(function(i2cAccess){
    var port = i2cAccess.ports.get(1);
    var srf02 = new SRF02(port,0x70);
    srf02.init().then(()=>{
      setInterval(() => {
        srf02.read().then((value) => {
//          console.log('value:', value);
          if(value > 6 && value < 600){
            head.innerHTML = value+"cm";
          }
        }, (err) => {
          if(err.code != 4){
            head.innerHTML = "ERROR";
          }
          console.log('error: code:'+err.code+" message:"+err.message);
        });
      },250);
    }, (err)=> {
      console.log("SRF02.init error"+err.message);
    });
  });
}, false);