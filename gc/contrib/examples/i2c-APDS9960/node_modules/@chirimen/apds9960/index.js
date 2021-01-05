(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.APDS9960 = factory());
}(this, (function () { 'use strict';

  // APDS9960 Gesture / Color / Proximity sensor driver for CHIRIMEN raspberry pi3
  //
  // Ported from https://github.com/liske/python-apds9960/blob/master/apds9960/device.py
  // Programmed by Satoru Takagi

  /** @param {number} ms Delay for a number of milliseconds. */
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  var APDS9960 = function (i2cPort, slaveAddress) {
    // APDS9960 i2c address
    this.APDS9960_I2C_ADDR = 0x39;

    if (!slaveAddress) {
      slaveAddress = this.APDS9960_I2C_ADDR;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;

    // consts
    // APDS9960 gesture parameters
    this.APDS9960_GESTURE_THRESHOLD_OUT = 10;
    this.APDS9960_GESTURE_SENSITIVITY_1 = 50;
    this.APDS9960_GESTURE_SENSITIVITY_2 = 20;

    // APDS9960 device IDs
    this.APDS9960_DEV_ID = [0xab, 0x9c, 0xa8, -0x55];

    // APDS9960 times
    this.APDS9960_TIME_FIFO_PAUSE = 0.03;

    // APDS9960 register addresses
    this.APDS9960_REG_ENABLE = 0x80;
    this.APDS9960_REG_ATIME = 0x81;
    this.APDS9960_REG_WTIME = 0x83;
    this.APDS9960_REG_AILTL = 0x84;
    this.APDS9960_REG_AILTH = 0x85;
    this.APDS9960_REG_AIHTL = 0x86;
    this.APDS9960_REG_AIHTH = 0x87;
    this.APDS9960_REG_PILT = 0x89;
    this.APDS9960_REG_PIHT = 0x8b;
    this.APDS9960_REG_PERS = 0x8c;
    this.APDS9960_REG_CONFIG1 = 0x8d;
    this.APDS9960_REG_PPULSE = 0x8e;
    this.APDS9960_REG_CONTROL = 0x8f;
    this.APDS9960_REG_CONFIG2 = 0x90;
    this.APDS9960_REG_ID = 0x92;
    this.APDS9960_REG_STATUS = 0x93;
    this.APDS9960_REG_CDATAL = 0x94;
    this.APDS9960_REG_CDATAH = 0x95;
    this.APDS9960_REG_RDATAL = 0x96;
    this.APDS9960_REG_RDATAH = 0x97;
    this.APDS9960_REG_GDATAL = 0x98;
    this.APDS9960_REG_GDATAH = 0x99;
    this.APDS9960_REG_BDATAL = 0x9a;
    this.APDS9960_REG_BDATAH = 0x9b;
    this.APDS9960_REG_PDATA = 0x9c;
    this.APDS9960_REG_POFFSET_UR = 0x9d;
    this.APDS9960_REG_POFFSET_DL = 0x9e;
    this.APDS9960_REG_CONFIG3 = 0x9f;
    this.APDS9960_REG_GPENTH = 0xa0;
    this.APDS9960_REG_GEXTH = 0xa1;
    this.APDS9960_REG_GCONF1 = 0xa2;
    this.APDS9960_REG_GCONF2 = 0xa3;
    this.APDS9960_REG_GOFFSET_U = 0xa4;
    this.APDS9960_REG_GOFFSET_D = 0xa5;
    this.APDS9960_REG_GOFFSET_L = 0xa7;
    this.APDS9960_REG_GOFFSET_R = 0xa9;
    this.APDS9960_REG_GPULSE = 0xa6;
    this.APDS9960_REG_GCONF3 = 0xaa;
    this.APDS9960_REG_GCONF4 = 0xab;
    this.APDS9960_REG_GFLVL = 0xae;
    this.APDS9960_REG_GSTATUS = 0xaf;
    this.APDS9960_REG_IFORCE = 0xe4;
    this.APDS9960_REG_PICLEAR = 0xe5;
    this.APDS9960_REG_CICLEAR = 0xe6;
    this.APDS9960_REG_AICLEAR = 0xe7;
    this.APDS9960_REG_GFIFO_U = 0xfc;
    this.APDS9960_REG_GFIFO_D = 0xfd;
    this.APDS9960_REG_GFIFO_L = 0xfe;
    this.APDS9960_REG_GFIFO_R = 0xff;

    // APDS9960 bit fields
    this.APDS9960_BIT_PON = 0b00000001;
    this.APDS9960_BIT_AEN = 0b00000010;
    this.APDS9960_BIT_PEN = 0b00000100;
    this.APDS9960_BIT_WEN = 0b00001000;
    this.APDS9960_BIT_AIEN = 0b00010000;
    this.APDS9960_BIT_PIEN = 0b00100000;
    this.APDS9960_BIT_GEN = 0b01000000;
    this.APDS9960_BIT_GVALID = 0b00000001;

    // APDS9960 modes
    this.APDS9960_MODE_POWER = 0;
    this.APDS9960_MODE_AMBIENT_LIGHT = 1;
    this.APDS9960_MODE_PROXIMITY = 2;
    this.APDS9960_MODE_WAIT = 3;
    this.APDS9960_MODE_AMBIENT_LIGHT_INT = 4;
    this.APDS9960_MODE_PROXIMITY_INT = 5;
    this.APDS9960_MODE_GESTURE = 6;
    this.APDS9960_MODE_ALL = 7;

    // LED Drive values
    this.APDS9960_LED_DRIVE_100MA = 0;
    this.APDS9960_LED_DRIVE_50MA = 1;
    this.APDS9960_LED_DRIVE_25MA = 2;
    this.APDS9960_LED_DRIVE_12_5MA = 3;

    // Proximity Gain (PGAIN) values
    this.APDS9960_PGAIN_1X = 0;
    this.APDS9960_PGAIN_2X = 1;
    this.APDS9960_PGAIN_4X = 2;
    this.APDS9960_PGAIN_8X = 3;

    // ALS Gain (AGAIN) values
    this.APDS9960_AGAIN_1X = 0;
    this.APDS9960_AGAIN_4X = 1;
    this.APDS9960_AGAIN_16X = 2;
    this.APDS9960_AGAIN_64X = 3;

    // Gesture Gain (GGAIN) values
    this.APDS9960_GGAIN_1X = 0;
    this.APDS9960_GGAIN_2X = 1;
    this.APDS9960_GGAIN_4X = 2;
    this.APDS9960_GGAIN_8X = 3;

    // LED Boost values
    this.APDS9960_LED_BOOST_100 = 0;
    this.APDS9960_LED_BOOST_150 = 1;
    this.APDS9960_LED_BOOST_200 = 2;
    this.APDS9960_LED_BOOST_300 = 3;

    // Gesture wait time values
    this.APDS9960_GWTIME_0MS = 0;
    this.APDS9960_GWTIME_2_8MS = 1;
    this.APDS9960_GWTIME_5_6MS = 2;
    this.APDS9960_GWTIME_8_4MS = 3;
    this.APDS9960_GWTIME_14_0MS = 4;
    this.APDS9960_GWTIME_22_4MS = 5;
    this.APDS9960_GWTIME_30_8MS = 6;
    this.APDS9960_GWTIME_39_2MS = 7;

    // Default values
    this.APDS9960_DEFAULT_ATIME = 219; // 103ms
    this.APDS9960_DEFAULT_WTIME = 246; // 27ms
    this.APDS9960_DEFAULT_PROX_PPULSE = 0x87; // 16us, 8 pulses
    this.APDS9960_DEFAULT_GESTURE_PPULSE = 0x89; // 16us, 10 pulses
    this.APDS9960_DEFAULT_POFFSET_UR = 0; // 0 offset
    this.APDS9960_DEFAULT_POFFSET_DL = 0; // 0 offset
    this.APDS9960_DEFAULT_CONFIG1 = 0x60; // No 12x wait (WTIME) factor
    this.APDS9960_DEFAULT_LDRIVE = this.APDS9960_LED_DRIVE_100MA;
    this.APDS9960_DEFAULT_PGAIN = this.APDS9960_PGAIN_4X;
    this.APDS9960_DEFAULT_AGAIN = this.APDS9960_AGAIN_4X;
    this.APDS9960_DEFAULT_PILT = 0; // Low proximity threshold
    this.APDS9960_DEFAULT_PIHT = 50; // High proximity threshold
    this.APDS9960_DEFAULT_AILT = 0xffff; // Force interrupt for calibration
    this.APDS9960_DEFAULT_AIHT = 0;
    this.APDS9960_DEFAULT_PERS = 0x11; // 2 consecutive prox or ALS for int.
    this.APDS9960_DEFAULT_CONFIG2 = 0x01; // No saturation interrupts or LED boost
    this.APDS9960_DEFAULT_CONFIG3 = 0; // Enable all photodiodes, no SAI
    this.APDS9960_DEFAULT_GPENTH = 40; // Threshold for entering gesture mode
    this.APDS9960_DEFAULT_GEXTH = 30; // Threshold for exiting gesture mode
    this.APDS9960_DEFAULT_GCONF1 = 0x40; // 4 gesture events for int., 1 for exit
    this.APDS9960_DEFAULT_GGAIN = this.APDS9960_GGAIN_4X;
    this.APDS9960_DEFAULT_GLDRIVE = this.APDS9960_LED_DRIVE_100MA;
    this.APDS9960_DEFAULT_GWTIME = this.APDS9960_GWTIME_2_8MS;
    this.APDS9960_DEFAULT_GOFFSET = 0; // No offset scaling for gesture mode
    this.APDS9960_DEFAULT_GPULSE = 0xc9; // 32us, 10 pulses
    this.APDS9960_DEFAULT_GCONF3 = 0; // All photodiodes active during gesture
    this.APDS9960_DEFAULT_GIEN = 0; // Disable gesture interrupts

    // gesture directions
    this.APDS9960_DIR_NONE = 0;
    this.APDS9960_DIR_LEFT = 1;
    this.APDS9960_DIR_RIGHT = 2;
    this.APDS9960_DIR_UP = 3;
    this.APDS9960_DIR_DOWN = 4;
    this.APDS9960_DIR_NEAR = 5;
    this.APDS9960_DIR_FAR = 6;
    this.APDS9960_DIR_ALL = 7;

    // state definitions
    this.APDS9960_STATE_NA = 0;
    this.APDS9960_STATE_NEAR = 1;
    this.APDS9960_STATE_FAR = 2;
    this.APDS9960_STATE_ALL = 3;
  };

  APDS9960.prototype = {
    init: async function () {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

      this.GestureZero = new Array(4);
      this.GestureData = {
        u_data: new Array(32),
        d_data: new Array(32),
        l_data: new Array(32),
        r_data: new Array(32),
        index: 0,
        total_gestures: 0,
        in_threshold: 0,
        out_threshold: 0,
      };
      // I2C stuff
      //		this.address = address;
      //		this.bus = bus;

      // instance variables for gesture detection
      this.gesture_ud_delta_ = 0;
      this.gesture_lr_delta_ = 0;

      this.gesture_ud_count_ = 0;
      this.gesture_lr_count_ = 0;

      this.gesture_near_count_ = 0;
      this.gesture_far_count_ = 0;

      this.gesture_state_ = 0;
      this.gesture_motion_ = this.APDS9960_DIR_NONE;

      this.gesture_data_ = this.GestureData;

      // check device id
      this.dev_id = await this.i2cSlave.read8(this.APDS9960_REG_ID);
      var devIdInvalid = true;
      for (let i = 0; i < this.APDS9960_DEV_ID.length; i++) {
        if (this.APDS9960_DEV_ID[i] == this.dev_id) {
          devIdInvalid = false;
          break;
        }
      }
      if (devIdInvalid) {
        console.log("ADPS9960InvalidDevId:", this.dev_id);
        throw (this.dev_id);
      }
      //		console.log("this.dev_id:",this.dev_id, this.dev_id.toString(16),devIdInvalid,this.APDS9960_DEV_ID,(this.APDS9960_DEV_ID).length);

      // disable all features
      await this.setMode(this.APDS9960_MODE_ALL, false);

      // set default values for ambient light and proximity registers
      await this.i2cSlave.write8(
        this.APDS9960_REG_ATIME,
        this.APDS9960_DEFAULT_ATIME
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_WTIME,
        this.APDS9960_DEFAULT_WTIME
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_PPULSE,
        this.APDS9960_DEFAULT_PROX_PPULSE
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_POFFSET_UR,
        this.APDS9960_DEFAULT_POFFSET_UR
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_POFFSET_DL,
        this.APDS9960_DEFAULT_POFFSET_DL
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_CONFIG1,
        this.APDS9960_DEFAULT_CONFIG1
      );
      await this.setLEDDrive(this.APDS9960_DEFAULT_LDRIVE);
      await this.setProximityGain(this.APDS9960_DEFAULT_PGAIN);
      await this.setAmbientLightGain(this.APDS9960_DEFAULT_AGAIN);
      await this.setProxIntLowThresh(this.APDS9960_DEFAULT_PILT);
      await this.setProxIntHighThresh(this.APDS9960_DEFAULT_PIHT);
      await this.setLightIntLowThreshold(this.APDS9960_DEFAULT_AILT);
      await this.setLightIntHighThreshold(this.APDS9960_DEFAULT_AIHT);

      await this.i2cSlave.write8(
        this.APDS9960_REG_PERS,
        this.APDS9960_DEFAULT_PERS
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_CONFIG2,
        this.APDS9960_DEFAULT_CONFIG2
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_CONFIG3,
        this.APDS9960_DEFAULT_CONFIG3
      );

      // set default values for gesture sense registers
      await this.setGestureEnterThresh(this.APDS9960_DEFAULT_GPENTH);
      await this.setGestureExitThresh(this.APDS9960_DEFAULT_GEXTH);
      console.log("getGestureEnterThresh:", await this.getGestureEnterThresh());
      console.log("getGestureExitThresh:", await this.getGestureExitThresh());
      await this.i2cSlave.write8(
        this.APDS9960_REG_GCONF1,
        this.APDS9960_DEFAULT_GCONF1
      );

      await this.setGestureGain(this.APDS9960_DEFAULT_GGAIN);
      await this.setGestureLEDDrive(this.APDS9960_DEFAULT_GLDRIVE);
      await this.setGestureWaitTime(this.APDS9960_DEFAULT_GWTIME);
      await this.i2cSlave.write8(
        this.APDS9960_REG_GOFFSET_U,
        this.APDS9960_DEFAULT_GOFFSET
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_GOFFSET_D,
        this.APDS9960_DEFAULT_GOFFSET
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_GOFFSET_L,
        this.APDS9960_DEFAULT_GOFFSET
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_GOFFSET_R,
        this.APDS9960_DEFAULT_GOFFSET
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_GPULSE,
        this.APDS9960_DEFAULT_GPULSE
      );
      await this.i2cSlave.write8(
        this.APDS9960_REG_GCONF3,
        this.APDS9960_DEFAULT_GCONF3
      );
      await this.setGestureIntEnable(this.APDS9960_DEFAULT_GIEN);
      console.log("APDS9960 initialized");
    },

    getMode: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_ENABLE);
    },
    setMode: async function (mode, enable) {
      if (enable == undefined) {
        enable = true;
      }
      //		console.log("called setMode:",mode,enable);
      // read ENABLE register
      var reg_val = await this.getMode();
      //		console.log("pre reg_val:",reg_val);

      if (mode < 0 || mode > this.APDS9960_MODE_ALL) {
        throw "ADPS9960InvalidMode:" + mode;
      }

      // change bit(s) in ENABLE register */
      if (mode == this.APDS9960_MODE_ALL) {
        if (enable) {
          reg_val = 0x7f;
        } else {
          reg_val = 0x00;
        }
      } else {
        if (enable) {
          reg_val |= 1 << mode;
        } else {
          reg_val &= ~(1 << mode);
        }
      }
      //		console.log("set reg_val:",reg_val);
      // write value to ENABLE register
      await this.i2cSlave.write8(this.APDS9960_REG_ENABLE, reg_val);
    },
    // start the light (R/G/B/Ambient) sensor
    enableLightSensor: async function (interrupts) {
      if (interrupts == undefined) {
        interrupts = true;
      }
      //		console.log("enableLightSensor:",this.APDS9960_DEFAULT_AGAIN,interrupts,this.APDS9960_MODE_AMBIENT_LIGHT);
      await this.setAmbientLightGain(this.APDS9960_DEFAULT_AGAIN);
      await this.setAmbientLightIntEnable(interrupts);
      await this.enablePower();
      await this.setMode(this.APDS9960_MODE_AMBIENT_LIGHT, true);
    },
    // stop the light sensor
    disableLightSensor: async function () {
      await this.setAmbientLightIntEnable(false);
      await this.setMode(this.APDS9960_MODE_AMBIENT_LIGHT, false);
    },

    // start the proximity sensor
    enableProximitySensor: async function (interrupts) {
      if (interrupts == undefined) {
        interrupts = true;
      }
      await this.setProximityGain(this.APDS9960_DEFAULT_PGAIN);
      await this.setLEDDrive(this.APDS9960_DEFAULT_LDRIVE);
      await this.setProximityIntEnable(interrupts);
      await this.enablePower();
      await this.setMode(this.APDS9960_MODE_PROXIMITY, true);
    },
    // stop the proximity sensor
    disableProximitySensor: async function () {
      await this.setProximityIntEnable(false);
      await this.setMode(this.APDS9960_MODE_PROXIMITY, false);
    },
    // start the gesture recognition engine
    enableGestureSensor: async function (interrupts) {
      if (interrupts == undefined) {
        interrupts = true;
      }
      this.resetGestureParameters();
      await this.i2cSlave.write8(this.APDS9960_REG_WTIME, 0xff);
      await this.i2cSlave.write8(
        this.APDS9960_REG_PPULSE,
        this.APDS9960_DEFAULT_GESTURE_PPULSE
      );
      await this.setLEDBoost(this.APDS9960_LED_BOOST_300);
      await this.setGestureIntEnable(interrupts);
      await this.setGestureMode(true);
      await this.enablePower();
      await this.setMode(this.APDS9960_MODE_WAIT, true);
      await this.setMode(this.APDS9960_MODE_PROXIMITY, true);
      await this.setMode(this.APDS9960_MODE_GESTURE, true);

      await sleep(200);
      await this.zeroGesture();
    },
    // stop the gesture recognition engine
    disableGestureSensor: async function () {
      this.resetGestureParameters();
      await this.setGestureIntEnable(false);
      await this.setGestureMode(false);
      await this.setMode(this.APDS9960_MODE_GESTURE, false);
    },
    // check if there is a gesture available
    isGestureAvailable: async function () {
      // Gesture Status Register
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GSTATUS);
      //		console.log("APDS9960_REG_GSTATUS:",val.toString(2));
      // shift and mask out GVALID bit
      val &= this.APDS9960_BIT_GVALID;
      //		console.log("isGestureAvailable:",val);
      return val == this.APDS9960_BIT_GVALID;
    },
    // processes a gesture event and returns best guessed gesture
    zeroGesture: async function () {
      /**
  		if ((await this.getMode() & 0b01000001)==0 || !( await this.isGestureAvailable())){ // 多分これで良いと思うけど・・
  			console.log("readGesture DIR_NONE");
  			return (this.APDS9960_DIR_NONE);
  		}
  		**/
      const fifo_level = await this.i2cSlave.read8(this.APDS9960_REG_GFLVL);
      if (fifo_level > 0) {
        const fifo_data = [];
        for (let i = 0; i < fifo_level; i++) {
          // _read_i2c_block_dataを
          fifo_data.push(
            await this._read_i2c_block_data(this.APDS9960_REG_GFIFO_U, 4)
          );
        }
        //			console.log("zeroGesture:",fifo_data);
        if (fifo_data.length >= 1) {
          //				var zc = new Array(4);
          // 		this.GestureZero=new Array(4);
          this.GestureZero = [0, 0, 0, 0];
          for (let i = 0; i < fifo_data.length; i++) {
            for (let j = 0; j < 4; j++) {
              //						if (fifo_data[i][0] +fifo_data[i][1] +fifo_data[i][2] +fifo_data[i][3] >245)
              this.GestureZero[j] += fifo_data[i][j];
            }
          }
          //			console.log("zeroGesture:",this.GestureZero);
          for (let j = 0; j < 4; j++) {
            this.GestureZero[j] = Math.floor(
              this.GestureZero[j] / fifo_data.length
            );
          }
        }
      }
      console.log("this.GestureZero:", this.GestureZero);
    },
    readGesture: async function () {
      // readGestureはあまり良い動きをしていません・・・
      var fifo_level = 0;
      var fifo_data = [];
      var motion;

      // make sure that power and gesture is on and data is valid
      if (
        ((await this.getMode()) & 0b01000001) == 0 ||
        !(await this.isGestureAvailable())
      ) {
        // 多分これで良いと思うけど・・
        console.log("readGesture DIR_NONE");
        return this.APDS9960_DIR_NONE;
      }
      // keep looping as long as gesture data is valid
      fifo_level = await this.i2cSlave.read8(this.APDS9960_REG_GFLVL);
      if (fifo_level > 0) {
        fifo_data = [];
        for (let i = 0; i < fifo_level; i++) {
          // _read_i2c_block_dataを
          var rawData = await this._read_i2c_block_data(
            this.APDS9960_REG_GFIFO_U,
            4
          );
          for (let j = 0; j < 4; j++) {
            rawData[j] = rawData[j] - this.GestureZero[j];
          }
          fifo_data.push(rawData);
        }
        if (fifo_data.length >= 1) {
          motion = this.surveyGesture(fifo_data);
        }
      }
      return motion;
    },
    surveyGesture: function (fifo_data) {
      // readGestureのgesture判定ルーチン。まだかなり不完全だと思います・・・
      var startDirX = 0;
      var startDirY = 0;
      var noEdgeX = false;
      var noEdgeY = false;
      console.log("surveyGesture:", fifo_data.length);

      // スタート方向を見るパターン
      for (let i = 0; i < fifo_data.length; i++) {
        var ydif = fifo_data[i][0] - fifo_data[i][1];
        var xdif = fifo_data[i][2] - fifo_data[i][3];
        var ytot = fifo_data[i][0] + fifo_data[i][1];
        var xtot = fifo_data[i][2] + fifo_data[i][3];

        if (xtot > 70) {
          // 両方センサー検知があるかどうかを見ている
          if (i == 0) {
            // バッファの開始時点で両方信号があった場合、Xのスタート検知ができてない
            noEdgeX = true;
          }
          if (!noEdgeX && startDirX == 0) {
            // スタート検知出来ていてまだ方向が決まってなければ、方向を決める
            startDirX = xdif;
          }
          if (startDirX * xdif > 0 && Math.abs(startDirX) < Math.abs(xdif)) {
            // 検知の方向と同じ方向の信号の最大値を蓄える
            startDirX = xdif;
          }
        }

        if (ytot > 70) {
          if (i == 0) {
            noEdgeY = true;
          }
          if (!noEdgeY && startDirY == 0) {
            startDirY = ydif;
          }
          if (startDirY * ydif > 0 && Math.abs(startDirY) < Math.abs(ydif)) {
            // 検知の方向と同じ方向の信号の最大値を蓄える
            startDirY = ydif;
          }
        }
      }

      var endDirX = 0;
      var endDirY = 0;
      noEdgeX = false;
      noEdgeY = false;
      // 終了方向を見るパターン
      for (let i = fifo_data.length - 1; i >= 0; i--) {
        const ydif = fifo_data[i][0] - fifo_data[i][1];
        const xdif = fifo_data[i][2] - fifo_data[i][3];
        const ytot = fifo_data[i][0] + fifo_data[i][1];
        const xtot = fifo_data[i][2] + fifo_data[i][3];

        if (xtot > 70) {
          // 両方センサー検知があるかどうかを見ている
          if (i == fifo_data.length - 1) {
            // バッファの開始時点で両方信号があった場合、Xのスタート検知ができてない
            noEdgeX = true;
          }
          if (!noEdgeX && endDirX == 0) {
            // スタート検知出来ていてまだ方向が決まってなければ、方向を決める
            endDirX = xdif;
          }
          if (endDirX * xdif > 0 && Math.abs(endDirX) < Math.abs(xdif)) {
            // 検知の方向と同じ方向の信号の最大値を蓄える
            endDirX = xdif;
          }
        }

        if (ytot > 70) {
          if (i == fifo_data.length - 1) {
            noEdgeY = true;
          }
          if (!noEdgeY && endDirY == 0) {
            endDirY = ydif;
          }
          if (endDirY * ydif > 0 && Math.abs(endDirY) < Math.abs(ydif)) {
            // 検知の方向と同じ方向の信号の最大値を蓄える
            endDirY = ydif;
          }
        }
      }

      var ans1;
      var ans1str = 0;
      // *moveがtrueで、maxAbs*difの大きいものが正解とする

      //		console.log(hist);

      if (Math.abs(Math.abs(startDirX) - Math.abs(startDirY)) < 30) {
        // XY方向で差が小さい場合判別不能とする？
        ans1 = "none";
      } else if (Math.abs(startDirX) < Math.abs(startDirY)) {
        // Y move
        if (startDirY > 0) {
          ans1 = "up";
        } else {
          ans1 = "down";
        }
        ans1str = Math.abs(startDirY);
      } else {
        // X move
        if (startDirX > 0) {
          ans1 = "left";
        } else {
          ans1 = "right";
        }
        ans1str = Math.abs(startDirX);
      }

      var ans2;
      var ans2str = 0;
      if (Math.abs(Math.abs(endDirX) - Math.abs(endDirY)) < 30) {
        // XY方向で差が小さい場合判別不能とする？
        ans2 = "none";
      } else if (Math.abs(endDirX) < Math.abs(endDirY)) {
        // Y move
        if (endDirY > 0) {
          ans2 = "down";
        } else {
          ans2 = "up";
        }
        ans2str = Math.abs(endDirY);
      } else {
        // X move
        if (endDirX > 0) {
          ans2 = "right";
        } else {
          ans2 = "left";
        }
        ans2str = Math.abs(endDirX);
      }

      var ans = "none";
      if (ans1str > ans2str) {
        ans = ans1;
      } else {
        ans = ans2;
      }

      console.log(
        "DIR:",
        ans,
        " dir1,2:",
        ans1,
        ans2,
        "  move_s x,y:",
        startDirX,
        startDirY,
        "  move_e x,y:",
        endDirX,
        endDirY
      );
      return ans;
    },
    // turn the APDS-9960 on
    enablePower: async function () {
      await this.setMode(this.APDS9960_MODE_POWER, true);
    },
    disablePower: async function () {
      // turn the APDS-9960 off
      await this.setMode(this.APDS9960_MODE_POWER, false);
    },
    // *******************************************************************************
    // ambient light and color sensor controls
    // *******************************************************************************

    // reads the ambient (clear) light level as a 16-bit value
    readAmbientLight: async function () {
      // read value from clear channel, low byte register
      var l = await this.i2cSlave.read8(this.APDS9960_REG_CDATAL);

      // read value from clear channel, high byte register
      var h = await this.i2cSlave.read8(this.APDS9960_REG_CDATAH);
      //		console.log("readAmbientLight:",l,h);

      return l + (h << 8);
    },
    // reads the red light level as a 16-bit value
    readRedLight: async function () {
      // read value from red channel, low byte register
      var l = await this.i2cSlave.read8(this.APDS9960_REG_RDATAL);

      // read value from red channel, high byte register
      var h = await this.i2cSlave.read8(this.APDS9960_REG_RDATAH);

      return l + (h << 8);
    },
    // reads the green light level as a 16-bit value
    readGreenLight: async function () {
      // read value from green channel, low byte register
      var l = await this.i2cSlave.read8(this.APDS9960_REG_GDATAL);

      // read value from green channel, high byte register
      var h = await this.i2cSlave.read8(this.APDS9960_REG_GDATAH);

      return l + (h << 8);
    },
    // reads the blue light level as a 16-bit value
    readBlueLight: async function () {
      // read value from blue channel, low byte register
      var l = await this.i2cSlave.read8(this.APDS9960_REG_BDATAL);

      // read value from blue channel, high byte register
      var h = await this.i2cSlave.read8(this.APDS9960_REG_BDATAH);

      return l + (h << 8);
    },

    // *******************************************************************************
    // Proximity sensor controls
    // *******************************************************************************

    // reads the proximity level as an 8-bit value
    readProximity: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_PDATA);
    },

    // *******************************************************************************
    // High-level gesture controls
    // *******************************************************************************

    // resets all the parameters in the gesture data member
    resetGestureParameters: function () {
      //NOT ASYNC FUNC
      this.gesture_data_.index = 0;
      this.gesture_data_.total_gestures = 0;

      this.gesture_ud_delta_ = 0;
      this.gesture_lr_delta_ = 0;

      this.gesture_ud_count_ = 0;
      this.gesture_lr_count_ = 0;

      this.gesture_near_count_ = 0;
      this.gesture_far_count_ = 0;

      this.gesture_state_ = 0;
      this.gesture_motion_ = this.APDS9960_DIR_NONE;
    },

    processGestureData: function () {
      //NOT ASYNC FUNC
      var u_first = 0;
      var d_first = 0;
      var l_first = 0;
      var r_first = 0;
      var u_last = 0;
      var d_last = 0;
      var l_last = 0;
      var r_last = 0;

      // if we have less than 4 total gestures, that's not enough
      if (this.gesture_data_.total_gestures <= 4) {
        console.log("not enough gestures");
        return false;
      }
      // check to make sure our data isn't out of bounds
      if (
        this.gesture_data_.total_gestures <= 32 &&
        this.gesture_data_.total_gestures > 0
      ) {
        // find the first value in U/D/L/R above the threshold
        for (let i = 0; i < this.gesture_data_.total_gestures; i++) {
          if (
            this.gesture_data_.u_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT &&
            this.gesture_data_.d_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT &&
            this.gesture_data_.l_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT &&
            this.gesture_data_.r_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT
          ) {
            u_first = this.gesture_data_.u_data[i];
            d_first = this.gesture_data_.d_data[i];
            l_first = this.gesture_data_.l_data[i];
            r_first = this.gesture_data_.r_data[i];
            break;
          }
        }
        // if one of the _first values is 0, then there is no good data
        if (u_first == 0 || d_first == 0 || l_first == 0 || r_first == 0) {
          console.log("no good data");
          return false;
        }
        // find the last value in U/D/L/R above the threshold
        for (let i = this.gesture_data_.total_gestures - 1; i >= 0; i--) {
          if (
            this.gesture_data_.u_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT &&
            this.gesture_data_.d_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT &&
            this.gesture_data_.l_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT &&
            this.gesture_data_.r_data[i] > this.APDS9960_GESTURE_THRESHOLD_OUT
          ) {
            u_last = this.gesture_data_.u_data[i];
            d_last = this.gesture_data_.d_data[i];
            l_last = this.gesture_data_.l_data[i];
            r_last = this.gesture_data_.r_data[i];
            break;
          }
        }
        // calculate the first vs. last ratio of up/down and left/right
        var ud_ratio_first = ((u_first - d_first) * 100) / (u_first + d_first);
        var lr_ratio_first = ((l_first - r_first) * 100) / (l_first + r_first);
        var ud_ratio_last = ((u_last - d_last) * 100) / (u_last + d_last);
        var lr_ratio_last = ((l_last - r_last) * 100) / (l_last + r_last);

        // determine the difference between the first and last ratios
        var ud_delta = ud_ratio_last - ud_ratio_first;
        var lr_delta = lr_ratio_last - lr_ratio_first;

        // accumulate the UD and LR delta values
        this.gesture_ud_delta_ += ud_delta;
        this.gesture_lr_delta_ += lr_delta;
        //			console.log("ud_delta:",this.gesture_ud_delta_,"  lr_delta:",this.gesture_lr_delta_);

        // determine U/D gesture
        if (this.gesture_ud_delta_ >= this.APDS9960_GESTURE_SENSITIVITY_1) {
          this.gesture_ud_count_ = 1;
        } else if (
          this.gesture_ud_delta_ <= -this.APDS9960_GESTURE_SENSITIVITY_1
        ) {
          this.gesture_ud_count_ = -1;
        } else {
          this.gesture_ud_count_ = 0;
        }

        // determine L/R gesture
        if (this.gesture_lr_delta_ >= this.APDS9960_GESTURE_SENSITIVITY_1) {
          this.gesture_lr_count_ = 1;
        } else if (
          this.gesture_lr_delta_ <= -this.APDS9960_GESTURE_SENSITIVITY_1
        ) {
          this.gesture_lr_count_ = -1;
        } else {
          this.gesture_lr_count_ = 0;
        }
        console.log(
          "ud_delta:",
          this.gesture_ud_delta_,
          " lr_delta:",
          this.gesture_lr_delta_
        );
        console.log(
          "ud_count:",
          this.gesture_ud_count_,
          "  lr_count:",
          this.gesture_lr_count_
        );

        // determine Near/Far gesture
        if (this.gesture_ud_count_ == 0 && this.gesture_lr_count_ == 0) {
          if (
            Math.abs(ud_delta) < this.APDS9960_GESTURE_SENSITIVITY_2 &&
            Math.abs(lr_delta) < this.APDS9960_GESTURE_SENSITIVITY_2
          ) {
            if (ud_delta == 0 && lr_delta == 0) {
              this.gesture_near_count_ += 1;
            } else if (ud_delta != 0 || lr_delta != 0) {
              this.gesture_far_count_ += 1;
            }
            if (this.gesture_near_count_ >= 10 && this.gesture_far_count_ >= 2) {
              if (ud_delta == 0 && lr_delta == 0) {
                this.gesture_state_ = this.APDS9960_STATE_NEAR;
              } else if (ud_delta != 0 && lr_delta != 0) {
                this.gesture_state_ = this.APDS9960_STATE_FAR;
              }
              return true;
            }
          }
        } else {
          if (
            Math.abs(ud_delta) < this.APDS9960_GESTURE_SENSITIVITY_2 &&
            Math.abs(lr_delta) < this.APDS9960_GESTURE_SENSITIVITY_2
          ) {
            if (ud_delta == 0 && lr_delta == 0) {
              this.gesture_near_count_ += 1;
            }
            if (this.gesture_near_count_ >= 10) {
              this.gesture_ud_count_ = 0;
              this.gesture_lr_count_ = 0;
              this.gesture_ud_delta_ = 0;
              this.gesture_lr_delta_ = 0;
            }
          }
        }
      }
      //		console.log("FALSE???");
      return false;
    },
    decodeGesture: function () {
      //NOT ASYNC FUNC
      // return if near or far event is detected
      if (this.gesture_state_ == this.APDS9960_STATE_NEAR) {
        this.gesture_motion_ = this.APDS9960_DIR_NEAR;
        return true;
      }
      if (this.gesture_state_ == this.APDS9960_STATE_FAR) {
        this.gesture_motion_ = this.APDS9960_DIR_FAR;
        return true;
      }
      // determine swipe direction
      if (this.gesture_ud_count_ == -1 && this.gesture_lr_count_ == 0) {
        this.gesture_motion_ = this.APDS9960_DIR_UP;
      } else if (this.gesture_ud_count_ == 1 && this.gesture_lr_count_ == 0) {
        this.gesture_motion_ = this.APDS9960_DIR_DOWN;
      } else if (this.gesture_ud_count_ == 0 && this.gesture_lr_count_ == 1) {
        this.gesture_motion_ = this.APDS9960_DIR_RIGHT;
      } else if (this.gesture_ud_count_ == 0 && this.gesture_lr_count_ == -1) {
        this.gesture_motion_ = this.APDS9960_DIR_LEFT;
      } else if (this.gesture_ud_count_ == -1 && this.gesture_lr_count_ == 1) {
        if (Math.abs(this.gesture_ud_delta_) > Math.abs(this.gesture_lr_delta_)) {
          this.gesture_motion_ = this.APDS9960_DIR_UP;
        } else {
          this.gesture_motion_ = this.APDS9960_DIR_DOWN;
        }
      } else if (this.gesture_ud_count_ == 1 && this.gesture_lr_count_ == -1) {
        if (Math.abs(this.gesture_ud_delta_) > Math.abs(this.gesture_lr_delta_)) {
          this.gesture_motion_ = this.APDS9960_DIR_DOWN;
        } else {
          this.gesture_motion_ = this.APDS9960_DIR_LEFT;
        }
      } else if (this.gesture_ud_count_ == -1 && this.gesture_lr_count_ == -1) {
        if (Math.abs(this.gesture_ud_delta_) > Math.abs(this.gesture_lr_delta_)) {
          this.gesture_motion_ = this.APDS9960_DIR_UP;
        } else {
          this.gesture_motion_ = this.APDS9960_DIR_LEFT;
        }
      } else if (this.gesture_ud_count_ == 1 && this.gesture_lr_count_ == 1) {
        if (Math.abs(this.gesture_ud_delta_) > Math.abs(this.gesture_lr_delta_)) {
          this.gesture_motion_ = this.APDS9960_DIR_DOWN;
        } else {
          this.gesture_motion_ = this.APDS9960_DIR_RIGHT;
        }
      } else {
        return false;
      }
      return true;
    },

    // *******************************************************************************
    // Getters and setters for register values
    // *******************************************************************************

    getProxIntLowThresh: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_PILT);
    },
    setProxIntLowThresh: async function (threshold) {
      await this.i2cSlave.write8(this.APDS9960_REG_PILT, threshold);
    },

    getProxIntHighThresh: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_PIHT);
    },
    setProxIntHighThresh: async function (threshold) {
      await this.i2cSlave.write8(this.APDS9960_REG_PIHT, threshold);
    },
    getLEDDrive: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONTROL);

      // shift and mask out LED drive bits
      return (val >> 6) & 0b00000011;
    },
    setLEDDrive: async function (drive) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONTROL);
      // set bits in register to given value
      drive &= 0b00000011;
      drive = drive << 6;
      val &= 0b00111111;
      val |= drive;

      await this.i2cSlave.write8(this.APDS9960_REG_CONTROL, val);
    },
    getProximityGain: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONTROL);
      // shift and mask out PDRIVE bits
      return (val >> 2) & 0b00000011;
    },
    setProximityGain: async function (drive) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONTROL);
      // set bits in register to given value
      drive &= 0b00000011;
      drive = drive << 2;
      val &= 0b11110011;
      val |= drive;

      await this.i2cSlave.write8(this.APDS9960_REG_CONTROL, val);
    },
    getAmbientLightGain: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONTROL);
      // shift and mask out ADRIVE bits
      return val & 0b00000011;
    },
    setAmbientLightGain: async function (drive) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONTROL);
      // set bits in register to given value
      drive &= 0b00000011;
      val &= 0b11111100;
      val |= drive;
      //		console.log("setAmbientLightGain:",drive,this.APDS9960_REG_CONTROL, val);

      await this.i2cSlave.write8(this.APDS9960_REG_CONTROL, val);
    },
    getLEDBoost: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONFIG2);
      // shift and mask out LED_BOOST bits
      return (val >> 4) & 0b00000011;
    },
    setLEDBoost: async function (boost) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONFIG2);
      // set bits in register to given value
      boost &= 0b00000011;
      boost = boost << 4;
      val &= 0b11001111;
      val |= boost;

      await this.i2cSlave.write8(this.APDS9960_REG_CONFIG2, val);
    },
    getProxGainCompEnable: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONFIG3);
      // Shift and mask out PCMP bits
      val = (val >> 5) & 0b00000001;
      return val == 1;
    },
    setProxGainCompEnable: async function (enable) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONFIG3);
      // set bits in register to given value
      val &= 0b11011111;
      if (enable) {
        val |= 0b00100000;
      }
      await this.i2cSlave.write8(this.APDS9960_REG_CONFIG3, val);
    },
    getProxPhotoMask: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONFIG3);
      // mask out photodiode enable mask bits
      return val & 0b00001111;
    },
    setProxPhotoMask: async function (mask) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_CONFIG3);
      // set bits in register to given value
      mask &= 0b00001111;
      val &= 0b11110000;
      val |= mask;

      await this.i2cSlave.write8(this.APDS9960_REG_CONFIG3, val);
    },
    getGestureEnterThresh: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_GPENTH);
    },
    setGestureEnterThresh: async function (threshold) {
      await this.i2cSlave.write8(this.APDS9960_REG_GPENTH, threshold);
    },
    getGestureExitThresh: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_GEXTH);
    },
    setGestureExitThresh: async function (threshold) {
      console.log("setGestureExitThresh:", this.APDS9960_REG_GEXTH, threshold);
      await this.i2cSlave.write8(this.APDS9960_REG_GEXTH, threshold);
    },
    getGestureGain: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF2);
      // shift and mask out PDRIVE bits
      return (val >> 5) & 0b00000011;
    },
    setGestureGain: async function (gain) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF2);
      // set bits in register to given value
      gain &= 0b00000011;
      gain = gain << 5;
      val &= 0b10011111;
      val |= gain;

      await this.i2cSlave.write8(this.APDS9960_REG_GCONF2, val);
    },
    getGestureLEDDrive: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF2);
      // shift and mask out LED drive bits
      return (val >> 3) & 0b00000011;
    },
    setGestureLEDDrive: async function (drive) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF2);
      // set bits in register to given value
      drive &= 0b00000011;
      drive = drive << 3;
      val &= 0b11100111;
      val |= drive;

      await this.i2cSlave.write8(this.APDS9960_REG_GCONF2, val);
    },
    getGestureWaitTime: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF2);
      // shift and mask out LED drive bits
      return val & 0b00000111;
    },
    setGestureWaitTime: async function (time) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF2);
      // set bits in register to given value
      time &= 0b00000111;
      val &= 0b11111000;
      val |= time;

      await this.i2cSlave.write8(this.APDS9960_REG_GCONF2, val);
    },
    getLightIntLowThreshold: async function () {
      return (
        (await this.i2cSlave.read8(this.APDS9960_REG_AILTL)) |
        ((await this.i2cSlave.read8(this.APDS9960_REG_AILTH)) << 8)
      );
    },
    setLightIntLowThreshold: async function (threshold) {
      // break 16-bit threshold into 2 8-bit values
      await this.i2cSlave.write8(this.APDS9960_REG_AILTL, threshold & 0x00ff);
      await this.i2cSlave.write8(
        this.APDS9960_REG_AILTH,
        (threshold & 0xff00) >> 8
      );
    },
    getLightIntHighThreshold: async function () {
      return (
        (await this.i2cSlave.read8(this.APDS9960_REG_AIHTL)) |
        ((await this.i2cSlave.read8(this.APDS9960_REG_AIHTH)) << 8)
      );
    },
    setLightIntHighThreshold: async function (threshold) {
      // break 16-bit threshold into 2 8-bit values
      await this.i2cSlave.write8(this.APDS9960_REG_AIHTL, threshold & 0x00ff);
      await this.i2cSlave.write8(
        this.APDS9960_REG_AIHTH,
        (threshold & 0xff00) >> 8
      );
    },
    getProximityIntLowThreshold: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_PILT);
    },
    setProximityIntLowThreshold: async function (threshold) {
      await this.i2cSlave.write8(this.APDS9960_REG_PILT, threshold);
    },
    getProximityIntHighThreshold: async function () {
      return await this.i2cSlave.read8(this.APDS9960_REG_PIHT);
    },
    setProximityIntHighThreshold: async function (threshold) {
      await this.i2cSlave.write8(this.APDS9960_REG_PIHT, threshold);
    },
    getAmbientLightIntEnable: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_ENABLE);
      return (val >> 4) & (0b00000001 == 1);
    },
    setAmbientLightIntEnable: async function (enable) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_ENABLE);

      // set bits in register to given value
      val &= 0b11101111;
      if (enable) {
        val |= 0b00010000;
      }
      await this.i2cSlave.write8(this.APDS9960_REG_ENABLE, val);
    },
    getProximityIntEnable: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_ENABLE);
      return (val >> 5) & (0b00000001 == 1);
    },
    setProximityIntEnable: async function (enable) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_ENABLE);
      // set bits in register to given value
      val &= 0b11011111;
      if (enable) {
        val |= 0b00100000;
      }
      await this.i2cSlave.write8(this.APDS9960_REG_ENABLE, val);
    },
    getGestureIntEnable: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF4);
      return (val >> 1) & (0b00000001 == 1);
    },
    setGestureIntEnable: async function (enable) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF4);
      // set bits in register to given value
      val &= 0b11111101;
      if (enable) {
        console.log("setGestureIntEnable: ENABLE");
        val |= 0b00000010;
      } else {
        console.log("setGestureIntEnable: DISABLE");
      }
      await this.i2cSlave.write8(this.APDS9960_REG_GCONF4, val);
    },
    clearAmbientLightInt: async function () {
      await this.i2cSlave.read8(this.APDS9960_REG_AICLEAR);
    },
    clearProximityInt: async function () {
      await this.i2cSlave.read8(this.APDS9960_REG_PICLEAR);
    },
    getGestureMode: async function () {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF4);
      return val & (0b00000001 == 1);
    },
    setGestureMode: async function (enable) {
      var val = await this.i2cSlave.read8(this.APDS9960_REG_GCONF4);
      // set bits in register to given value
      val &= 0b11111110;
      if (enable) {
        val |= 0b00000001;
      }
      await this.i2cSlave.write8(this.APDS9960_REG_GCONF4, val);
    },
    _read_i2c_block_data: async function (cmd, num) {
      await this.i2cSlave.writeByte(cmd);
      var ans = await this.i2cSlave.readBytes(num);
      //		console.log("reg:",cmd," num:",num,"  ans:",ans);
      return ans;
    },

    /**
  		// 以下は不要
  	// *******************************************************************************
  	// Raw I2C Reads and Writes
  	// *******************************************************************************

  	_read_byte_data: async function(, cmd){
  		return this.bus.read_byte_data(this.address, cmd)
  	},
  	_write_byte_data: async function(, cmd, val){
  		return this.bus.write_byte_data(this.address, cmd, val)
  	},

  	_read_i2c_block_data: async function(, cmd, num){
  		return this.bus.read_i2c_block_data(this.address, cmd, num)
  	}
  	**/
  };

  return APDS9960;

})));
