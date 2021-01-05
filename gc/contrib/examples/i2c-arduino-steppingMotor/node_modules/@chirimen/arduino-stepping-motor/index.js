(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SteppingMotor = factory());
}(this, (function () { 'use strict';

  // @ts-check

  /** @param {number} ms Delay for a number of milliseconds. */
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  var SteppingMotor = function(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  };

  SteppingMotor.prototype = {
    init: async function() {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
      await this.i2cSlave.write16(0x03, 0);
    },
    readStatus: async function() {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      const data = await this.i2cSlave.read8(0x00);
      return data;
    },
    move: async function(step) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      if (step > 0) {
        await this.i2cSlave.write16(0x01, step | 0);
      }
      if (step < 0) {
        await this.i2cSlave.write16(0x02, -step | 0);
      }

      for (;;) {
        const busy = await this.i2cSlave.read8(0x00);
        if (busy == 0) return;
        await sleep(100);
      }
    },
    abort: async function() {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      await this.i2cSlave.write16(0x03, 0);
    },
    setSpeed: async function(speed) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      await this.i2cSlave.write16(0x04, speed | 0);
    },
    setMinSpeed: async function(speed) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      await this.i2cSlave.write16(0x05, speed);
    },
    setAccelRate: async function(rate) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      await this.i2cSlave.write16(0x06, rate);
    },
    enable: async function(en) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      await this.i2cSlave.write16(0x07, en ? 1 : 0);
    }
  };

  return SteppingMotor;

})));
