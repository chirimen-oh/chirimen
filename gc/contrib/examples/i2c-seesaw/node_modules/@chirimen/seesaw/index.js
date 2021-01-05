(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Seesaw = factory());
}(this, (function () { 'use strict';

  // @ts-check
  // Seesaw driver for CHIRIMEN raspberry pi3
  // Adafruit's Open Source Multi Functional Interface used ATSAMD09
  // based on https://learn.adafruit.com/adafruit-seesaw-atsamd09-breakout/using-the-seesaw-platform
  // and https://github.com/adafruit/Adafruit_CircuitPython_seesaw/blob/master/adafruit_seesaw/seesaw.py
  //
  // Programmed by Satoru Takagi   02/2020

  /** @param {number} ms Delay for a number of milliseconds. */
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  var Seesaw = function (i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x49;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;

    // consts
    this._STATUS_BASE = 0x00;

    this._GPIO_BASE = 0x01;
    this._SERCOM0_BASE = 0x02;

    this._TIMER_BASE = 0x08;
    this._ADC_BASE = 0x09;
    this._DAC_BASE = 0x0a;
    this._INTERRUPT_BASE = 0x0b;
    this._DAP_BASE = 0x0c;
    this._EEPROM_BASE = 0x0d;
    this._NEOPIXEL_BASE = 0x0e;
    this._TOUCH_BASE = 0x0f;

    this._GPIO_DIRSET_BULK = 0x02;
    this._GPIO_DIRCLR_BULK = 0x03;
    this._GPIO_BULK = 0x04;
    this._GPIO_BULK_SET = 0x05;
    this._GPIO_BULK_CLR = 0x06;
    this._GPIO_BULK_TOGGLE = 0x07;
    this._GPIO_INTENSET = 0x08;
    this._GPIO_INTENCLR = 0x09;
    this._GPIO_INTFLAG = 0x0a;
    this._GPIO_PULLENSET = 0x0b;
    this._GPIO_PULLENCLR = 0x0c;

    this._STATUS_HW_ID = 0x01;
    this._STATUS_VERSION = 0x02;
    this._STATUS_OPTIONS = 0x03;
    this._STATUS_TEMP = 0x04;
    this._STATUS_SWRST = 0x7f;

    this._TIMER_STATUS = 0x00;
    this._TIMER_PWM = 0x01;
    this._TIMER_FREQ = 0x02;

    this._ADC_STATUS = 0x00;
    this._ADC_INTEN = 0x02;
    this._ADC_INTENCLR = 0x03;
    this._ADC_WINMODE = 0x04;
    this._ADC_WINTHRESH = 0x05;
    this._ADC_CHANNEL_OFFSET = 0x07;

    this._SERCOM_STATUS = 0x00;
    this._SERCOM_INTEN = 0x02;
    this._SERCOM_INTENCLR = 0x03;
    this._SERCOM_BAUD = 0x04;
    this._SERCOM_DATA = 0x05;

    this._NEOPIXEL_STATUS = 0x00;
    this._NEOPIXEL_PIN = 0x01;
    this._NEOPIXEL_SPEED = 0x02;
    this._NEOPIXEL_BUF_LENGTH = 0x03;
    this._NEOPIXEL_BUF = 0x04;
    this._NEOPIXEL_SHOW = 0x05;

    this._TOUCH_CHANNEL_OFFSET = 0x10;

    this._HW_ID_CODE = 0x55;
    this._EEPROM_I2C_ADDR = 0x3f;

    this.INPUT = 0x00;
    this.OUTPUT = 0x01;
    this.INPUT_PULLUP = 0x02;
    this.INPUT_PULLDOWN = 0x03;

    // Pixel color order constants
    this.NP_PIXEL_ORDERS = [
      [0, 1, 2],
      [1, 0, 2],
      [0, 1, 2, 3],
      [1, 0, 2, 3],
    ];
    this.NP_RGB = 0;
    this.NP_GRB = 1; // これがWS2812B (bpp=3)
    this.NP_RGBW = 2;
    this.NP_GRBW = 3;

    this.SAMD09_Pinmap = {
      analog_pins: [0x02, 0x03, 0x04, 0x05],
      pwm_width: 8,
      pwm_pins: [0x04, 0x05, 0x06, 0x07],
      touch_pins: [],
      neopixel_pins: [9, 10, 11, 14, 15, 24, 25],
      gpio_pins: [9, 10, 11, 14, 15, 24, 25],
    };
  };

  Seesaw.prototype = {
    init: async function () {
      console.log("seesaw init: Slave Addr:", this.slaveAddress.toString(16));
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
      await this.sw_reset();
    },
    sw_reset: async function () {
      await this.writeReg8(this._STATUS_BASE, this._STATUS_SWRST, 0xff);
      await sleep(500);
      var chip_id = await this.readReg8(this._STATUS_BASE, this._STATUS_HW_ID);
      console.log("chip_id:", chip_id.toString(16));
      if (chip_id != this._HW_ID_CODE) {
        console.log("ERROR chip_id is invalid");
      } else {
        console.log("chip_id is valid");
      }
      var pid =
        (await this.readReg32(this._STATUS_BASE, this._STATUS_VERSION)) >> 16;
      console.log("PartsID? SAMD09 should be 0xE49:", pid.toString(16)); // e49
      this.pin_mapping = this.SAMD09_Pinmap;
    },
    pin_mode: async function (pin, mode) {
      if (pin >= 32) ; else {
        await this.pin_mode_bulk(1 << pin, mode);
      }
    },
    _pin_mode_bulk_x: async function (capacity, offset, pins, mode) {
      // capacity, offset : NO EFFECT...
      if (capacity != 4) {
        // only support portA
        return;
      }
      //		var cmd = bytearray(capacity);
      //		cmd[offset:] = struct.pack(">I", pins)
      var cmd = pins;
      if (mode == this.OUTPUT) {
        await this.writeReg32(this._GPIO_BASE, this._GPIO_DIRSET_BULK, cmd);
      } else if (mode == this.INPUT) {
        await this.writeReg32(this._GPIO_BASE, this._GPIO_DIRCLR_BULK, cmd);
        await this.writeReg32(this._GPIO_BASE, this._GPIO_PULLENCLR, cmd);
      } else if (mode == this.INPUT_PULLUP) {
        await this.writeReg32(this._GPIO_BASE, this._GPIO_DIRCLR_BULK, cmd);
        await this.writeReg32(this._GPIO_BASE, this._GPIO_PULLENSET, cmd);
        await this.writeReg32(this._GPIO_BASE, this._GPIO_BULK_SET, cmd);
      } else if (mode == this.INPUT_PULLDOWN) {
        await this.writeReg32(this._GPIO_BASE, this._GPIO_DIRCLR_BULK, cmd);
        await this.writeReg32(this._GPIO_BASE, this._GPIO_PULLENSET, cmd);
        await this.writeReg32(this._GPIO_BASE, this._GPIO_BULK_CLR, cmd);
      } else {
        throw new Error("Invalid pin mode");
      }
    },
    pin_mode_bulk: async function (pins, mode) {
      await this._pin_mode_bulk_x(4, 0, pins, mode);
    },
    /**
  	pin_mode_bulk_b: async function( pins, mode){
          await this._pin_mode_bulk_x(8, 4, pins, mode)
  	}
  	**/
    digital_write: async function (pin, value) {
      //        """Set the value of an output pin by number"""
      if (pin >= 32) ; else {
        await this.digital_write_bulk(1 << pin, value);
      }
    },
    digital_write_bulk: async function (pins, value) {
      //        """Set the mode of pins on the 'A' port as a bitmask"""
      //        cmd = struct.pack(">I", pins)
      if (value) {
        await this.writeReg32(this._GPIO_BASE, this._GPIO_BULK_SET, pins);
      } else {
        await this.writeReg32(this._GPIO_BASE, this._GPIO_BULK_CLR, pins);
      }
    },

    digital_read: async function (pin) {
      //	if pin >= 32:
      //            return self.digital_read_bulk_b((1 << (pin - 32))) != 0
      return (await this.digital_read_bulk(1 << pin)) != 0;
    },
    digital_read_bulk: async function (pins) {
      var buf = await this.readReg32(this._GPIO_BASE, this._GPIO_BULK);
      //		console.log("digital_read_bulk0:",buf.toString(16));
      buf = buf & 0x3fffffff;
      //		console.log("digital_read_bulk1:",buf.toString(16));
      return buf & pins;
    },
    analog_read: async function (pin) {
      var pinIndex = this.inArray(pin, this.pin_mapping.analog_pins);
      if (pinIndex < 0) {
        console.log("Invalid ADC pin");
        return null;
      }
      var buf = this.readReg16(
        this._ADC_BASE,
        this._ADC_CHANNEL_OFFSET + pinIndex
      );
      await sleep(1);
      return buf;
    },
    analog_write: async function (pin, value) {
      // PWM_write 0..255
      var pin_found = false;
      var cmd;
      if (this.pin_mapping.pwm_width == 16) ; else {
        var pinIndex = this.inArray(pin, this.pin_mapping.pwm_pins);
        if (pinIndex >= 0) {
          pin_found = true;
          cmd = (pinIndex << 8) | (value & 0xff);
        }
      }

      if (pin_found == false) {
        console.log("Invalid PWM pin");
      }
      await this.writeReg16(this._TIMER_BASE, this._TIMER_PWM, cmd);
      await sleep(1);
    },
    get_temp: async function () {
      // NOT SUPPORTED SAMD09 always -1
      var buf = await this.readReg32(this._STATUS_BASE, this._STATUS_TEMP, 5);
      console.log("get_temp:", buf.toString(2));
      buf = buf & 0x3fffffff;
      var temp = 0.00001525878 * buf;
      return temp;
    },
    set_pwm_freq: async function (pin, freq) {
      // NOT SUPPORTED SAMD09 Fixed 2.87KHz?
      var pinIndex = this.inArray(pin, this.pin_mapping.pwm_pins);
      if (pinIndex >= 0) {
        console.log("Set pwm freq:", freq);
        var cmd = (pinIndex << 16) | (freq & 0xffff);
        await this.writeReg24(this._TIMER_BASE, this._TIMER_FREQ, cmd);
      } else {
        console.log("Invalid PWM pin");
      }
    },
    initNeopixel: async function (pin, quantity, auto_write, pixel_order) {
      //		console.log("initNeopixel:pin:",pin," quantity:",quantity," auto_write:",auto_write);

      // default: WS2812(B)
      this._pixel_order = this.NP_PIXEL_ORDERS[this.NP_GRB];
      if (
        pixel_order != undefined &&
        0 <= pixel_order &&
        pixel_order <= this.NP_PIXEL_ORDERS.length
      ) {
        this._pixel_order = this.NP_PIXEL_ORDERS[pixel_order];
      }
      this._bpp = this._pixel_order.length;

      // バルク転送で送れるれるピクセル数 (32(bufMax) - 2(reg1,reg2) - 2(offset16bit))/_bpp
      this._bulk_pix = 9;
      if (this._bpp == 4) {
        this._bulk_pix = 7;
      }

      // set pixels buffer
      // up to 63 pixels(4bpp), 85pixels(3bpp) (bufferSize:255bits)
      if (!quantity) {
        console.log("quantity should be assigned exit");
        return false;
      } else {
        if (quantity * this._bpp > 255) {
          console.log("quantity overflow exit");
          return false;
        } else {
          this._n = quantity;
        }
      }

      this._auto_write = true;
      if (auto_write == false) {
        this._auto_write = false;
      }

      var pinIndex = this.inArray(pin, this.pin_mapping.neopixel_pins);
      if (pinIndex < 0) {
        console.log("Invalid pin number exit");
        return null;
      }

      await this.writeReg8(this._NEOPIXEL_BASE, this._NEOPIXEL_PIN, pin);
      var cmd = this._n * this._bpp;
      await this.writeReg16(this._NEOPIXEL_BASE, this._NEOPIXEL_BUF_LENGTH, cmd);
    },
    setPixel: async function (n, r, g, b) {
      //		console.log("setPixel:",n,r,g,b);
      var c = this.getColor(r, g, b);

      await this.setPixel_int(n, c);
      if (this._auto_write) {
        await this.showPixels();
      }
    },
    setPixel_int: async function (n, c) {
      var bn = n * this._bpp;
      var n_h = bn >>> 8;
      var n_l = bn & 0xff;
      if (this._bpp == 3) {
        await this.writeRegN(this._NEOPIXEL_BASE, this._NEOPIXEL_BUF, [
          n_h,
          n_l,
          c[this._pixel_order[0]],
          c[this._pixel_order[1]],
          c[this._pixel_order[2]],
        ]);
      } else {
        // untested code (bpp:4 rgbw,grbw devices)
        await this.writeRegN(this._NEOPIXEL_BASE, this._NEOPIXEL_BUF, [
          n_h,
          n_l,
          c[this._pixel_order[0]],
          c[this._pixel_order[1]],
          c[this._pixel_order[2]],
          c[this._pixel_order[3]],
        ]);
      }
    },
    setPixels_int: async function (offset, rgbArray) {
      //		console.log("setPixels_int:",offset,rgbArray);
      var buf_offset = offset * this._bpp;
      //  rgbArray: [[r,g,b],[r,g,b],[r,g,b],...] 3bpp max : 32-2-2bytes : 9pixs
      //  rgbArray: [[r,g,b,w],[r,g,b,w],[r,g,b,w],...] 4bpp : max 32-2-2bytes : 7pixs
      var n_h = buf_offset >>> 8;
      var n_l = buf_offset & 0xff;
      var cmd = [n_h, n_l];
      for (var i = 0; i < rgbArray.length; i++) {
        cmd.push(rgbArray[i][this._pixel_order[0]]);
        cmd.push(rgbArray[i][this._pixel_order[1]]);
        cmd.push(rgbArray[i][this._pixel_order[2]]);
        if (this._bpp == 4) {
          cmd.push(rgbArray[i][this._pixel_order[3]]);
        }
      }
      if (cmd.length + 2 > 32) {
        console.log("exceeded 32bytes");
        return false;
      }
      await this.writeRegN(this._NEOPIXEL_BASE, this._NEOPIXEL_BUF, cmd);
    },
    setPixels: async function (offset, rgbArray) {
      //		console.log("setPixels");
      // 32バイト上限超える場合、分割して送信する
      var ca = [];
      var ofs = offset;
      for (var i = 0; i < rgbArray.length; i++) {
        ca.push(rgbArray[i]);
        if (ca.length == this._bulk_pix) {
          //				console.log("setPixels setPixels_int:",ofs);
          await this.setPixels_int(ofs, ca);
          ca = [];
          ofs = offset + i + 1;
        }
      }
      if (ca.length > 0) {
        //			console.log("call setPixs_int Last :ofs:",ofs,"  ca:",ca);
        await this.setPixels_int(ofs, ca);
      }

      if (this._auto_write) {
        await this.showPixels();
      }
    },
    fillPixels1: async function (r, g, b) {
      // 1pixづつ送るタイプ(基本obsolute)
      var c = this.getColor(r, g, b);
      for (var i = 0; i < this._n; i++) {
        await this.setPixel_int(i, c);
      }
      if (this._auto_write) {
        await this.showPixels();
      }
    },
    fillPixels: async function (r, g, b) {
      //		console.log("fillPixels2:",r,g,b,"  n:",this._n);
      var c = this.getColor(r, g, b);

      var ca = [];
      for (var i = 0; i < this._n; i++) {
        ca.push(c);
      }
      await this.setPixels(0, ca);
    },
    showPixels: async function () {
      //		console.log("showPixels");
      await this.writeRegN(this._NEOPIXEL_BASE, this._NEOPIXEL_SHOW);
    },
    getColor: function (r, g, b, w) {
      if (this._bpp == 4) {
        if (w == undefined) {
          w = 0;
        }
        if (r == g && g == b) {
          // untested code
          w = r;
          r = 0;
          g = 0;
          b = 0;
        }
        var c = [r, g, b, w];
        return c;
      } else {
        return [r, g, b];
      }
    },

    // ===============================================================
    // more low level func
    readReg8: async function (baseAddr, funcAddr, delay) {
      await this.i2cSlave.writeBytes([baseAddr & 0xff, funcAddr & 0xff]);
      if (delay) {
        await sleep(delay);
      } else {
        await sleep(8);
      }
      var dat = await this.i2cSlave.readBytes(1);
      return dat[0];
    },
    writeReg8: async function (baseAddr, funcAddr, data8) {
      //		console.log("writeReg8: B:",baseAddr.toString(16)," F:",funcAddr.toString(16)," D:",data8.toString(16));
      await this.i2cSlave.writeBytes([
        baseAddr & 0xff,
        funcAddr & 0xff,
        data8 & 0xff,
      ]);
    },
    readReg16: async function (baseAddr, funcAddr, delay) {
      await this.i2cSlave.writeBytes([baseAddr & 0xff, funcAddr & 0xff]);
      if (delay) {
        await sleep(delay);
      } else {
        await sleep(8);
      }
      var dat = await this.i2cSlave.readBytes(2);
      return (dat[0] << 8) | dat[1];
    },
    writeReg16: async function (baseAddr, funcAddr, data16) {
      //		console.log("writeReg16: B:",baseAddr.toString(16)," F:",funcAddr.toString(16), " DH:",((data16 >>> 8) & 0xFF).toString(16), " DL:",(data16 & 0xFF).toString(16));
      await this.i2cSlave.writeBytes([
        baseAddr & 0xff,
        funcAddr & 0xff,
        (data16 >>> 8) & 0xff,
        data16 & 0xff,
      ]);
    },
    readReg24: async function (baseAddr, funcAddr, delay) {
      await this.i2cSlave.writeBytes([baseAddr & 0xff, funcAddr & 0xff]);
      if (delay) {
        await sleep(delay);
      } else {
        await sleep(8);
      }
      var dat = await this.i2cSlave.readBytes(3);
      return (dat[0] << 16) | (dat[1] << 8) | dat[2];
    },
    writeReg24: async function (baseAddr, funcAddr, data24) {
      await this.i2cSlave.writeBytes([
        baseAddr & 0xff,
        funcAddr & 0xff,
        (data24 >>> 16) & 0xff,
        (data24 >>> 8) & 0xff,
        data24 & 0xff,
      ]);
    },
    readReg32: async function (baseAddr, funcAddr, delay) {
      //		console.log("readReg32:",baseAddr.toString(16),funcAddr.toString(16));
      await this.i2cSlave.writeBytes([baseAddr & 0xff, funcAddr & 0xff]);
      if (delay) {
        await sleep(delay);
      } else {
        await sleep(8);
      }
      var dat = await this.i2cSlave.readBytes(4);
      //		var dat32 = ((dat[0]<<24) | (dat[1]<<16) | (dat[2]<<8) | (dat[3]));
      //		console.log("readReg32:",dat32.toString(2));
      return (dat[0] << 24) | (dat[1] << 16) | (dat[2] << 8) | dat[3];
    },
    writeReg32: async function (baseAddr, funcAddr, data32) {
      //		console.log("writeReg32:",baseAddr.toString(16),funcAddr.toString(16),data32.toString(16));
      await this.i2cSlave.writeBytes([
        baseAddr & 0xff,
        funcAddr & 0xff,
        data32 >>> 24,
        (data32 >>> 16) & 0xff,
        (data32 >>> 8) & 0xff,
        data32 & 0xff,
      ]);
    },
    readRegN: async function (baseAddr, funcAddr, readByteLength, delay) {
      await this.i2cSlave.writeBytes([baseAddr & 0xff, funcAddr & 0xff]);
      if (delay) {
        await sleep(delay);
      } else {
        await sleep(8);
      }
      var dat = await this.i2cSlave.readBytes(readByteLength);
      return dat;
    },
    writeRegN: async function (baseAddr, funcAddr, dataBytes) {
      //		console.log("writeRegN:B:",baseAddr.toString(16)," F:",funcAddr.toString(16)," dat:",this.get16Array(dataBytes));
      var wBytes = [baseAddr & 0xff, funcAddr & 0xff];
      if (dataBytes && dataBytes.length) {
        for (var i = 0; i < dataBytes.length; i++) {
          wBytes.push(dataBytes[i] & 0xff);
        }
      }
      //		console.log("writeRegN:",wBytes);
      await this.i2cSlave.writeBytes(wBytes);
    },
    inArray: function (val, arr) {
      var ans = -1;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
          ans = i;
          break;
        }
      }
      return ans;
    },
    get16Array: function (intArr, base) {
      if (!intArr || !intArr.length) {
        return intArr;
      }
      if (!base) {
        base = 16;
      }
      var ans = intArr[0].toString(base);
      //		console.log("intArr.length:",intArr.length, intArr);
      if (intArr.length > 1) {
        for (var i = 1; i < intArr.length; i++) {
          ans = ans + "," + intArr[i].toString(base);
        }
      }
      return ans;
    },
  };

  return Seesaw;

})));
