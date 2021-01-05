(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.canzasi = factory());
}(this, (function () { 'use strict';

  // @ts-check

  var canzasi = function (i2cPort) {
    this.i2cPort = i2cPort;
    this.slaveAddress = 0x30;
    this.i2cSlave = null;
  };

  canzasi.prototype = {
    init: async function () {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    },
    set: async function (value) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is gone.....");
      }
      await this.i2cSlave.writeByte(value);
    }
  };

  return canzasi;

})));
