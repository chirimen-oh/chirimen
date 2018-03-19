var SteppingMotor = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
};

SteppingMotor.prototype = {
  init: function(){
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        this.i2cSlave = i2cSlave;
        await this.i2cSlave.write16(0x03,0);
        console.log("init ok:"+this.i2cSlave);
        resolve();
      },(err)=>{
        reject(err);
      });
    });
  },
  readStatus: function(){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
         let data = await this.i2cSlave.read8(0x00);
         resolve(data);
      }
    });
  },
  move: function(step){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        if(step>0)
          await this.i2cSlave.write16(0x01,(step|0));
        if(step<0)
          await this.i2cSlave.write16(0x02,(-step|0));
        let shortSleep=()=>{
          return new Promise(resolve => setTimeout(resolve, 100));
        }
        for(;;){
          let busy = await this.i2cSlave.read8(0x00);
          if(busy==0){
            resolve();
            break;
          }
          await shortSleep();
        };
      }
    });
  },
  abort: function(){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write16(0x03,0);
        resolve();
      }
    });
  },
  setSpeed: function(speed){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write16(0x04,speed|0);
        resolve();
      }
    });
  },
  setMinSpeed: function(speed){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write16(0x05,speed);
        resolve();
      }
    });
  },
  setAccelRate: function(rate){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write16(0x06,rate);
        resolve();
      }
    });
  },
  enable: function(en){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write16(0x07,en?1:0);
        resolve();
      }
    });
  },
};
