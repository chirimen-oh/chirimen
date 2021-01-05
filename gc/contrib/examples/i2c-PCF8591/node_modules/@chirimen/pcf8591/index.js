(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.PCF8591 = factory());
}(this, (function () { 'use strict';

	// @ts-check
	// PCF8591 driver for CHIRIMEN raspberry pi3
	// 4ch 8bit ADC, 1ch 8bit DAC
	// CDS, Thermister, VR and a LED
	// Programmed by Satoru Takagi

	var PCF8591 = function(i2cPort,slaveAddress){
		if (!slaveAddress){
			slaveAddress = 0x48;
		}
		this.i2cPort = i2cPort;
		this.i2cSlave = null;
		this.slaveAddress = slaveAddress;
		this.refV = 3.3;
	};

	PCF8591.prototype = {
		init: async function(){
			this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

		},
		readADC: async function(ch){
			if ( ch >=0 && ch < 4 ){
				await this.i2cSlave.read8(ch + 0x40); // prev data..
				var ans  = await this.i2cSlave.read8(ch + 0x40);
				return( this.refV * ans / 0xff );
			} else {
				return(-1);
			}
		},
		setDAC: async function(vl){
			var dav = Math.floor(0xff * vl / this.refV) & 0xff;
			await this.i2cSlave.write8(0x40, dav);
		}
	};

	return PCF8591;

})));
