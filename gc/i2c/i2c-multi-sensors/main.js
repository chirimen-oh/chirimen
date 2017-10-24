'use strict';

window.addEventListener('load', function (){
  var head1 = document.querySelector('#head1');
  var head2 = document.querySelector('#head2');
  
  navigator.requestI2CAccess().then(async (i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var srf02 = new SRF02(port,0x70);
    var adt7410 = new ADT7410(port,0x48);
    await srf02.init();
    await adt7410.init();
    setInterval(()=>{
      srf02.read().then((value)=>{
//        console.log('value:', value);
        head1.innerHTML = value;
      },(err)=>{
        console.log('srf02 error:'+err);
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

