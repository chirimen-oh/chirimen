var PCA9685 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
  this.minPulse=null;
  this.maxPulse=null;
  this.angleRange=null;
};

PCA9685.prototype = {
  sleep: function(ms, generator){
    setTimeout(function(){generator.next()}, ms);
  },
  init: function(minPulse,maxPulse,angleRange,noSetZero){
    var self = this;
    if(self.minPulse && self.maxPulse && self.angleRange){
      console.log("alredy set param");
    }
    if(minPulse && maxPulse && angleRange){ 
      self.minPulse = minPulse;
      self.maxPulse = maxPulse;
      self.angleRange = angleRange;
      console.log("set servo setting.");
    }else{
      self.minPulse = 0.0005;
      self.maxPulse = 0.0024;
      self.angleRange = 180;
      console.log("set defaul servo setting.");
    }

    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {

          i2cSlave.write8(0x00,0x00);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x01,0x04);
          yield self.sleep(10, thread);

          i2cSlave.write8(0x00,0x10);
          yield self.sleep(10, thread);
          i2cSlave.write8(0xfe,0x64);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x00,0x00);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x06,0x00);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x07,0x00);
          yield self.sleep(300, thread);


          if ( !noSetZero ){
            for ( var servoPort = 0 ; servoPort < 16 ; servoPort ++ ){
              self.setServo(servoPort , 0 ).then(
                function(){
                  resolve();
                },
                function(){
                  reject();
                }
              );
            }
          }

        })();

        thread.next();
      });
    });  
  },
  setServo: function(servoPort,angle){
    console.log(servoPort,angle)
    var self = this;

    var portStart = 8;
    var portInterval = 4;
        
    var freq = 61; // Hz
    var tickSec = ( 1 / freq ) / 4096; // 1bit resolution( sec )
    
    var minPulse,maxPulse,angleRange,pulseRange;
    if(self.minPulse && self.maxPulse && self.angleRange){
      minPulse = self.minPulse;
      maxPulse = self.maxPulse;
      pulseRange = maxPulse - minPulse;
      angleRange = self.angleRange;
      console.log(minPulse,maxPulse,angleRange,pulseRange);
    }else{
      console.log("wrong param.");
    }
    var pulse = minPulse + angle / angleRange * pulseRange;
    var ticks = Math.round(pulse / tickSec);
    
    var tickH = (( ticks >> 8 ) & 0x0f);
    var tickL = (ticks & 0xff);

    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {
          var pwm = Math.round(portStart + servoPort * portInterval);
          i2cSlave.write8( pwm + 1, tickH);
          yield self.sleep(1, thread);
          i2cSlave.write8( pwm, tickL);

          resolve();

        })();

        thread.next();
      });
    });  
  }
};