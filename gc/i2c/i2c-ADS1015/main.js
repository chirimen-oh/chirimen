'use strict';

window.addEventListener('load', function (){
  var head = document.querySelector('#head');
  
  // WebI2C Initialized
  navigator.requestI2CAccess()
    .then(function(i2cAccess){
      var port = i2cAccess.ports.get(1);
      var ads1015 = new ADS1015(port,0x48);
      ads1015.init().then(()=>{
        console.log("new");
        setInterval(() => {
          ads1015.read(0).then((value) => {
            console.log('value:', value);
            head.innerHTML = value;
          }, (err) => {
            if(err.code != 4){
              head.innerHTML = "ERROR";
            }
            console.log('error: code:'+err.code+" message:"+err.message);
          });
        },100);
      }, (err)=> {
        console.log("ADS1015.init error"+err.message);
      });
    });
}, false);