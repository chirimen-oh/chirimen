var SRF02 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
  this.i2cSlave = null;
};

SRF02.prototype = {
  init: function(){
    return new Promise((resolve, reject) => {
      this.i2cPort.open(this.slaveAddress).then((i2cSlave) => {
//        console.log("SRF02.init OK");
        this.i2cSlave = i2cSlave;
        resolve();
      },(err) => {
        console.log("SRF02.init() Error: "+error.message);
        reject(err);
      });
    });
  },
  read: function(){
    return new Promise((resolve, reject)=>{
      if(this.i2cSlave){
        this.i2cSlave.write8(0x00, 0x51).then((v) => {
          setTimeout(()=>{
            this.i2cSlave.read16(0x02).then( (v) =>{
              var h = (v & 0x00FF) << 8;
              var l = (v & 0xFF00) >> 8;
              var res = h + l;
              if(res >= 16 && res <= 600){
                resolve(res);
              }else{
                var err = {code:4, message:"out of range error: "+res+"cm"};
                reject(err);
              }
            },(err) => {
              console.log("SRF02.read: read16(0x02) error: "+err.message);
              err.code = 3;
              reject(err.message);
            });
          },70);
        }, (err) => {
          console.log("SRF02.read: write8(0,0x51) error: "+err.message);
          err.code = 2;
          reject(err.message);
        });
      }else{
        console.log("Please call SRF02.init() before SRF02.read().");
        err.code = 1;
        reject(err.message);
      }
    });
  }
};