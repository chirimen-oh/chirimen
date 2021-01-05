(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ADS1x15 = factory());
}(this, (function () { 'use strict';

	// ADS1115 driver for WebI2C
	// may be OK for ADS1015
	// 2018/12/22 Satoru Takagi
	// 2019/10/01 Support Differential Mode

	/** @param {number} ms Delay for a number of milliseconds. */
	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

	var ADS1x15 = function(i2cPort,slaveAddress){
		this.i2cPort = i2cPort;
		this.slaveAddress = slaveAddress;
		this.i2cSlave = null;
		this.amplifierTable=[4.096,4.096,1.024,1.024,0.256,0.256,0.256,0.256];// 000,001,010,010,100,101,110,111 スペックシートと違う？
		this.amplifierConf = 1;
		this.prevCh = -1;
	};

	ADS1x15.prototype = {
		init: async function(isAds1115, amplifierSelection){
			if (isAds1115) {
				this.convertDelay = 80; // 測定が安定するには・・・
				this.bitShift = 0;
			} else {
				this.convertDelay = 10; // 本来は1ms?
				this.bitShift = 4;
			}
			if (amplifierSelection != undefined && amplifierSelection >= 0 && amplifierSelection < 8) {
				this.amplifierConf = amplifierSelection;
			}
			var i2cSlave = await this.i2cPort.open(this.slaveAddress);
			this.i2cSlave = i2cSlave;
		},
		read: async function(channel){
			var config;
			if (channel=="0,1"){ // Differential Mode p0,p1
				config= 0x0000;
			} else if (channel=="0,3"){// Differential Mode p0,p3
				config= 0x1000;
			} else if (channel=="1,3"){// Differential Mode p1,p3
				config= 0x2000;
			} else if (channel=="2,3"){// Differential Mode p2,p3
				config= 0x3000;
			} else {
				channel = Number(channel);
				if ((channel < 0) || (3 < channel)) {
					throw new Error("ADS1x15.read: channel error " + channel);
				} else {
					channel = Number(channel);
					config = 0x4000 + (channel * 0x1000); // ADC channel
				}
			}

			if (this.i2cSlave == null) {
				throw new Error("i2cSlave is gone.....");
			}

			config |= 0x8000; // Set 'start single-conversion' bit
			config |= 0x0003; // Disable the comparator (default val)
			config |= 0x0080; // 1600SPS(samples per second)(ADS1015),128SPS(ADS1115)  (default)
			config |= 0x0100; // Power-down single-shot mode (default)
			config |= (this.amplifierConf << 9);  // 0x0200; // +/-4.096V range = Gain 1
			var confL = config >> 8;
			var confH = config & 0x00ff;
			var data = confH | confL;

			await this.i2cSlave.write16(0x01, data);
			await sleep(this.convertDelay);
			var v = await this.i2cSlave.read16(0);
			if ( channel != this.prevCh ){
				await sleep(this.convertDelay);
				v = await this.i2cSlave.read16(0);
			}
			var vH = (v & 0x00ff) << 8;
			var vL = (v >> 8)& 0x00ffff;
			var value = (vH | vL) >> this.bitShift;
			this.prevCh = channel;
			return value;
		},
		getSignedVal: function (val) {
			return new Int16Array([val])[0];
		},
		getVoltage: function(rawVal){
			return ( this.amplifierTable[this.amplifierConf] * 2 * this.getSignedVal(rawVal) / ( this.bitShift == 4 ? 0x0fff : 0xffff ) );
		}
	};

	return ADS1x15;

})));
