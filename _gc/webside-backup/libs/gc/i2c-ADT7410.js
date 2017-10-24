var ADT7410 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
};

ADT7410.prototype = {
  read: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {

          // get distance value
          Promise.all([
            i2cSlave.read8(0x00, true),
            i2cSlave.read8(0x01, true),
          ]).then(function(v){
            var temp = ((v[0] << 8) + v[1])/128.0;
            resolve(temp);
          }).catch(reject);
        })();

        thread.next();
      });
    });  
  }
};