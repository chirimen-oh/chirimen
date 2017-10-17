"use strict";

window.addEventListener('load', function (){

  navigator.requestI2CAccess().then((i2cAccess)=>{
    var port = i2cAccess.ports.get(1);
    var s11059 = new S11059(port,0x2a);
    s11059.init().then(()=>{
      setInterval(()=>{
        s11059.read().then((values)=>{
          var red = values[0];
          var green = values[1];
          var blue = values[2];
//          console.log("red:" + red + " green:" + green + " blue:" + blue);
          document.getElementById("red").textContent = "R:"+red;
          document.getElementById("green").textContent = "G:"+green;
          document.getElementById("blue").textContent = "B:"+blue;
          document.getElementById("color").style.backgroundColor = "rgb("+red+","+green+","+blue+")"; 
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
