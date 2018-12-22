// ADS1115 driver for WebI2C
// may be OK for ADS1015
// 2018/12/22 Satoru Takagi

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
		try{
			if ( isAds1115 ){
				this.convertDelay = 80; // 測定が安定するには・・・
				this.bitShift = 0;
				console.log("ADS1115.init (16bitADC) OK");
			} else {
				this.convertDelay = 10; // 本来は1ms?
				this.bitShift = 4;
				console.log("ADS1015.init (12bitADC) OK");
			}
			if ( amplifierSelection != undefined  && amplifierSelection>=0 && amplifierSelection < 8){
				this.amplifierConf = amplifierSelection;
			}
			console.log("set amplifier to +-" + this.amplifierTable[this.amplifierConf]);
			var i2cSlave = await this.i2cPort.open(this.slaveAddress);
			this.i2cSlave = i2cSlave;
		} catch(err){
			console.log("ADS1015.init() Error: "+error.message);
			throw Error( err );
		}
	},
	read: async function(channel){
		if((channel > 3)||(channel < 0)){
			console.log("ADS1x15.read: channel error "+channel);
			throw Error("ADS1x15.read: channel error "+channel);
		}
		if(!this.i2cSlave){
			console.log("i2cSlave is gone.....");
			throw Error("i2cSlave is gone.....");
		}
		var config = 0x4000 + (channel * 0x1000); // ADC channel 
//      	console.log((config).toString(16));
		config |= 0x8000; // Set 'start single-conversion' bit
		config |= 0x0003; // Disable the comparator (default val)
		config |= 0x0080; // 1600SPS(samples per second)(ADS1015),128SPS(ADS1115)  (default)
		config |= 0x0100; // Power-down single-shot mode (default)
		config |= (this.amplifierConf << 9);  // 0x0200; // +/-4.096V range = Gain 1
//      	console.log((this.amplifierConf << 9).toString(16));
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
		return ( value );
	},
	getSignedVal: function( w ){
		// Convert 16bit two's complement data to signed integer while maintaining endianness
		//  console.log("getSignedVal:",w.toString(16),"   :" , w);
		//  console.log("getSignedVal:",w);
		// var l = w >>> 8;
		// var b = w & 0xff;
		// var v = l + ( b << 8 );
		var v = w;
//		console.log("Val:",w.toString(16),b.toString(16),l.toString(16),v.toString(16),b,l,v);
		if ( v >= 0x8000 ){
			return ( - ((65535 - v ) + 1 ) );
		} else {
			return(v);
		}
	},
	getVoltage: function(rawVal){
		return ( this.amplifierTable[this.amplifierConf] * 2 * this.getSignedVal(rawVal) / ( this.bitShift == 4 ? 0x0fff : 0xffff ) );
	}
};