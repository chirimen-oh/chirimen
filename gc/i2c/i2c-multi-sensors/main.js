'use strict';

window.addEventListener('load', function (){
  var head1 = document.querySelector('#head1');
  var head2 = document.querySelector('#head2');
  
  navigator.requestI2CAccess().then(async (i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var grovelight = new GROVELIGHT(port,0x29);
    var adt7410 = new ADT7410(port,0x48);
    await grovelight.init();
    await adt7410.init();
    setInterval(()=>{
      grovelight.read().then((value)=>{
//        console.log('value:', value);
        head1.innerHTML = value;
      },(err)=>{
        console.log('grovelight error:'+err);
      });
      adt7410.read().then((value)=>{
//        console.log('value:', value);
        head2.innerHTML = value;
      },(err)=>{
        console.log('adt7410 error:'+err);
      });
    },500);
  }).catch(e=> console.error('error', e));
}, false);

