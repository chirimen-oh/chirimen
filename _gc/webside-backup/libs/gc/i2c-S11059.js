var S11059 = function(i2cPort,slaveAddress) {
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
}

S11059.prototype = {
  init: function() {
    var self = this;
    return new Promise(function(resolve, reject) {

      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {
          i2cSlave.write8(0x00, 0x03);
          yield self.sleep(500, thread);
          resolve();
        })();

        thread.next();
      }).catch(function(reason) {
        reject(reason);
      });
    });
  },

  sleep: function(ms, generator){
    setTimeout(function(){generator.next()}, ms);
  },

  compose: function(high, low) {
    return (high << 8 & 0xff) + (low & 0xff);
  },

  read: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        Promise.all([
          i2cSlave.read8(0x03),
          i2cSlave.read8(0x04),
          i2cSlave.read8(0x05),
          i2cSlave.read8(0x06),
          i2cSlave.read8(0x07),
          i2cSlave.read8(0x08)
        ])
        .then(function(values) {
          var red = self.compose(values[0], values[1]);
          var green = self.compose(values[2], values[3]);
          var blue = self.compose(values[4], values[5]);
          resolve([red, green, blue]);
        }).catch (function(reason) {
          reject(reason);
        });
      }).catch (function(reason) {
        reject(reason);
      });
    });
  }
}
