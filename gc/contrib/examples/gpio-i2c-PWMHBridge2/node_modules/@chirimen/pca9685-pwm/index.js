(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.PCA9685_PWM = factory());
}(this, (function () { 'use strict';

  // サーボではなく、純粋にPWM出力装置としてPCA9685を使います
  // based on http://www.geocities.jp/zattouka/GarageHouse/micon/Motor/PCA9685/shield1.htm
  // Programmed by Satoru Takagi

  var PCA9685_PWM = function(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
    this.frequency = null;
  };

  PCA9685_PWM.prototype = {
    sleep: function(ms) {
      return new Promise(resolve => {
        setTimeout(resolve, ms);
      });
    },
    init: async function(frequency, noSetZero) {
      // frequency : in Hz
      // angleRange : -angleRange to +angleRange degrees

      if (this.frequency) {
        console.error("alredy initialised");
      }
      if (frequency) {
        this.frequency = frequency;
      } else {
        this.frequency = 60; // default: 60Hz
      }
      var freq = Math.floor(25000000 / (4096 * this.frequency) - 1);

      if (freq < 0x03 || freq > 0xff) {
        throw new Error("Frequency should be between 24Hz to 1526Hz");
      }

      var i2cSlave = await this.i2cPort.open(this.slaveAddress);
      this.i2cSlave = i2cSlave;

      await this.i2cSlave.write8(0x00, 0x00);
      await this.i2cSlave.write8(0x01, 0x04);
      await this.i2cSlave.write8(0x00, 0x10);
      await this.i2cSlave.write8(0xfe, freq);
      await this.i2cSlave.write8(0x00, 0x00);
      await this.i2cSlave.write8(0x06, 0x00);
      await this.i2cSlave.write8(0x07, 0x00);
      await this.sleep(300);
      if (!noSetZero) {
        for (var pwmPort = 0; pwmPort < 16; pwmPort++) {
          await this.setPWM(pwmPort, 0);
        }
      }
    },
    setPWM: async function(pwmPort, dutyRatio) {
      // dutyRatio : 0.0(OFF) .. 1.0(ON)
      const portStart = 8;
      const portInterval = 4;
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave Address does'nt yet open!");
      }
      if (pwmPort < 0 || pwmPort > 15) {
        throw new Error("PWM Port should be between 0 to 15");
      }
      if (dutyRatio < 0 || dutyRatio > 1) {
        throw new Error("dutyRatio should be between 0.0 to 1.0");
      }
      var ticks = Math.floor(4095 * dutyRatio);
      var tickH = (ticks >> 8) & 0x0f;
      var tickL = ticks & 0xff;

      var pwm = Math.round(portStart + pwmPort * portInterval);
      await this.i2cSlave.write8(pwm + 1, tickH);
      await this.i2cSlave.write8(pwm, tickL);
    }
  };

  return PCA9685_PWM;

})));
