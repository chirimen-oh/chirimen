var PCA9685 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
  this.minPulse=null;
  this.maxPulse=null;
  this.angleRange=null;
};

PCA9685.prototype = {
  sleep: function(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  },
  init: function(minPulse,maxPulse,angleRange,noSetZero){
  // minPulse,maxPulse: in sec
  // angleRange : -angleRange to +angleRange degrees
    if(this.minPulse && this.maxPulse && this.angleRange){
      console.log("alredy set param");
    }
    if(minPulse && maxPulse && angleRange){ 
      this.minPulse = minPulse;
      this.maxPulse = maxPulse;
      this.angleRange = angleRange;
//      console.log("set servo setting.");
    }else{
      this.minPulse = 0.0011;
      this.maxPulse = 0.0019;
      this.angleRange = 30.0;
//      console.log("set defaul servo setting.");
    }

    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        this.i2cSlave = i2cSlave;
        await this.i2cSlave.write8(0x00,0x00);
        await this.i2cSlave.write8(0x01,0x04);
        await this.i2cSlave.write8(0x00,0x10);
        await this.i2cSlave.write8(0xfe,0x64);
        await this.i2cSlave.write8(0x00,0x00);
        await this.i2cSlave.write8(0x06,0x00);
        await this.i2cSlave.write8(0x07,0x00);
        await this.sleep(300);
        if ( !noSetZero ){
          for ( var servoPort = 0 ; servoPort < 16 ; servoPort ++ ){
            this.setServo(servoPort , 0 ).then(()=>resolve(),(err)=>reject());
          }
        }
      },(err)=>{
        reject(err);
      });
    });  
  },
  setServo: function(servoPort,angle){
//    console.log(servoPort,angle)
    const portStart = 8;
    const portInterval = 4;
    const freq = 61; // Hz
    const tickSec = ( 1 / freq ) / 4096; // 1bit resolution( sec )
    
    var minPulse,maxPulse,angleRange,pulseRange;
    if(this.minPulse && this.maxPulse && this.angleRange){
      minPulse = this.minPulse;
      maxPulse = this.maxPulse;
      pulseRange = maxPulse - minPulse;
      angleRange = this.angleRange;
//      console.log(minPulse,maxPulse,angleRange,pulseRange);
    }else{
      console.log("wrong param.");
    }
    if ( angle < -angleRange){
        angle = -angleRange;
    } else if ( angle > angleRange ){
        angle = angleRange;
    }
    if ( servoPort < 0){
        servoPort = 0;
    } else if ( servoPort > 15 ){
        servoPort = 15;
    }

    var pulse = ((minPulse + maxPulse) + angle / angleRange * pulseRange ) / 2.0;
    console.log("pulse:",pulse*1000," msec");
    var ticks = Math.round(pulse / tickSec);
    
    var tickH = (( ticks >> 8 ) & 0x0f);
    var tickL = (ticks & 0xff);

    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        var pwm = Math.round(portStart + servoPort * portInterval);
        await this.i2cSlave.write8( pwm + 1, tickH);
        await this.i2cSlave.write8( pwm, tickL);
        resolve();
      }
    });  
  }
};
