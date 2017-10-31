"use strict";

window.addEventListener('load', function (){

  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var s11059 = new S11059(port,0x2a);
    s11059.init().then(()=>{
      setInterval(()=>{

        s11059.readR8G8B8().then((values)=>{
          var red = values[0] & 0xff;
          var green = values[1] & 0xff;
          var blue = values[2] & 0xff;
          var gain_level = values[3];

//          console.log("red:" + red + " green:" + green + " blue:" + blue);
          document.getElementById("sensor").textContent = "R:"+red+" G:"+green+" B:"+blue+" GAIN:"+gain_level;
          document.getElementById("color").style.backgroundColor = "rgb("+red+", "+green+","+blue+")";
        }).catch(function(reason) {
          console.log("READ ERROR:" + reason);
        });
      },1000);
    },(err)=>{
      console.log("S11059 init error");
    });
  },(err)=>{
    console.log("requestI2CAccess error");
  });

}, false);
