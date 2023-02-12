(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.HT16K33 = factory());
})(this, (function () { 'use strict';

	// HT16K33 LED matrix driver for CHIRIMEN WebI2C

	var HT16K33 = function (i2cPort, slaveAddress) {
		console.log("instance HT16K33");
		if (!slaveAddress) {
			slaveAddress = 0x70;
		}
		this.i2cPort = i2cPort;
		this.i2cSlave = null;
		this.slaveAddress = slaveAddress;

		this.HT16K33_BLINK_CMD = 0x80;
		this.HT16K33_BLINK_DISPLAYON = 0x01;
		this.HT16K33_BLINK_OFF = 0x00;
		this.HT16K33_BLINK_2HZ = 0x02;
		this.HT16K33_BLINK_1HZ = 0x04;
		this.HT16K33_BLINK_HALFHZ = 0x06;
		this.HT16K33_SYSTEM_SETUP = 0x20;
		this.HT16K33_OSCILLATOR = 0x01;
		this.HT16K33_CMD_BRIGHTNESS = 0xe0;
		this.led8x8tableAdafruit = [
			7,0,1,2,3,4,5,6,
			23,16,17,18,19,20,21,22,
			39,32,33,34,35,36,37,38,
			55,48,49,50,51,52,53,54,
			71,64,65,66,67,68,69,70,
			87,80,81,82,83,84,85,86,
			103,96,97,98,99,100,101,102,
			119,112,113,114,115,116,117,118
		]; // 8x8マトリクスLEDの物理的な配置 (0:左上,63:右下) から、論理LED番号へ変換するテーブル
		this.led8x8tableAitendoR = [
			7,6,5,4,3,2,1,0,
			23,22,21,20,19,18,17,16,
			39,38,37,36,35,34,33,32,
			55,54,53,52,51,50,49,48,
			71,70,69,68,67,66,65,64,
			87,86,85,84,83,82,81,80,
			103,102,101,100,99,98,97,96,
			119,118,117,116,115,114,113,112
		]; // 8x8マトリクスLEDの物理的な配置 (AITENDO版）
		this.led8x8tableAitendo = [
			0,16,32,48,64,80,96,112,
			1,17,33,49,65,81,97,113,
			2,18,34,50,66,82,98,114,
			3,19,35,51,67,83,99,115,
			4,20,36,52,68,84,100,116,
			5,21,37,53,69,85,101,117,
			6,22,38,54,70,86,102,118,
			7,23,39,55,71,87,103,119,
		]; // 8x8マトリクスLEDの物理的な配置 (AITENDO版）
		this.led8x8table = this.led8x8tableAdafruit;
		
		this.led16x8tableAitendo = function(){
			var ans = new Array(128);
			for(var y = 0 ; y < 8 ; y++){ // y
				for(var x = 0 ; x < 8 ; x++){ // x
					ans[x+y*16]= y+x*16;
					ans[x+8+y*16]= y+8+x*16;
				}
			}
			return ( ans );
		}(); // 16x8マトリクスLEDの物理的な配置 (AITENDO版）

		// 4桁 7セグメントLEDモジュールの物理配置
		this.num7seg = [
			[1, 1, 1, 1, 1, 1, 0], //0
			[0, 1, 1, 0, 0, 0, 0], //1
			[1, 1, 0, 1, 1, 0, 1], //2
			[1, 1, 1, 1, 0, 0, 1], //3
			[0, 1, 1, 0, 0, 1, 1], //4
			[1, 0, 1, 1, 0, 1, 1], //5
			[1, 0, 1, 1, 1, 1, 1], //6
			[1, 1, 1, 0, 0, 0, 0], //7
			[1, 1, 1, 1, 1, 1, 1], //8
			[1, 1, 1, 1, 0, 1, 1]  //9
		];
		this.numDigit =  [4, 3, 1, 0];

		this.chr14seg ={ // 14セグメントLEDのパターン(https://en.wikipedia.org/wiki/Fourteen-segment_display)
			number:[0xC3F,0x406,0xDB,0x8F,0xE6,0xED,0xFD,0x1401,0xFF,0xE7],
			alphabet:[0xF7,0x128F,0x39,0x120F,0xF9,0xF1,0xBD,0xF6,0x1209,0x1E,0x2470,0x38,0x536,0x2136,0x3F,0xF3,0x203F,0x20F3,0x18D,0x1201,0x3E,0xC30,0x2836,0x2D00,0x1500,0xC09]
		};
	};

	HT16K33.prototype = {
		init: async function(){
			this.buffer= new Array(16);
			this.clear();
			var i2cSlave = await this.i2cPort.open(this.slaveAddress);
			this.i2cSlave = i2cSlave;
			await this.i2cSlave.writeBytes([this.HT16K33_SYSTEM_SETUP | this.HT16K33_OSCILLATOR]);
			await this.set_blink(this.HT16K33_BLINK_OFF);
			await this.set_brightness(15);
		},
		set_blink: async function(frequency){
			if ( frequency != this.HT16K33_BLINK_OFF && 
				frequency != this.HT16K33_BLINK_2HZ &&
				frequency != this.HT16K33_BLINK_1HZ &&
				frequency != this.HT16K33_BLINK_HALFHZ ){
					console.error("Frequency must be one of ..");
					return;
			}
			await this.i2cSlave.writeBytes([this.HT16K33_BLINK_CMD | this.HT16K33_BLINK_DISPLAYON | frequency]);
		},
		set_brightness: async function(brightness){
			if (brightness < 0 || brightness > 15){
				console.error("Brightness must be a value of 0 to 15.");
				return;
			}
			await this.i2cSlave.writeBytes([this.HT16K33_CMD_BRIGHTNESS | brightness]);
		},
		set_led: function(led, value){ // ledは物理配置と関係ない論理番号
			if (led < 0 || led > 127){
				console.error("LED must be value of 0 to 127.");
				return;
			}
			var pos = Math.floor(led / 8);
			var offset = led % 8;
			if (!value){
				this.buffer[pos] = this.buffer[pos] & (~(1<<offset));
			} else {
				this.buffer[pos] = this.buffer[pos] | ((1<<offset));
			}
		},
		set_8x8_led: function(ledNum,value){ // ledNum:0..63
			if ( ledNum < 0 || ledNum > 63){
				console.error("8x8 ledNum shoud be 0..63");
				return;
			}
			var logicalLed = this.led8x8table[ledNum];
			this.set_led(logicalLed,value);
		},
		set_8x8_array: function(value){ // 64個の0||1配列
			if ( value.length != 64){
				console.error("The value must be an array of length 64.");
				return;
			}
			for ( var i = 0 ; i < 64 ; i++ ){
				this.set_8x8_led(i, value[i]);
			}
		},
		write_display: async function(){
			for ( var i = 0 ; i < this.buffer.length ; i++ ){
				// console.log(this.buffer[i].toString(16));
				await this.i2cSlave.write8(i , this.buffer[i]);
			}
		},
		clear: function(){
			for ( var i = 0 ; i < this.buffer.length ; i++ ){
				this.buffer[i]=0;
			}
		},
		set4digitLED:function(numb, dp) {
			var zp = 0;
			for (var p of this.numDigit) { // clear decimal point
				this.set_led(7 + 16 * p, 0);
			}
			var num;
			if (dp && dp > 0 && dp < 4) {
				num = numb * Math.pow(10, dp);
				this.set_led(7 + 16 * this.numDigit[dp], 1);
				zp = dp;
			} else {
				num = numb;
			}
			if (numb >= 1) {
				zp = -1;
			}
			var d = [];
			d[4] = -1;
			if (num >= 10000) {
				d[4] = 0;
			}
			for (var i = 3; i >= 0; i--) {
				d[i] = Math.floor(num % Math.pow(10, i + 1) / Math.pow(10, i));
				if (d[i + 1] == -1 && d[i] == 0 && zp != i) { d[i] = -1; }
				this.set7seg(d[i], 16 * this.numDigit[i]);
			}
			//console.log(d[3], d[2], d[1], d[0])
		},
		set7seg:function(num, k) {
			if (num < 0) {
				for (var i = 0; i < 7; i++) {
					this.set_led(i + k, 0);
				}
			} else {
				for (var i = 0; i < 7; i++) {
					if (this.num7seg[num][i]) {
						this.set_led(i + k, 1);
					} else {
						this.set_led(i + k, 0);
					}
				}
			}
		},
		setAitendo8x8(){
			this.led8x8table = this.led8x8tableAitendo;
		},
		set_16x8_array: function(value){ // Aitendoの128個の0||1配列
			if ( value.length != 128){
				console.error("The value must be an array of length 128.");
				return;
			}
			for ( var i = 0 ; i < 128 ; i++ ){
				this.set_led(this.led16x8tableAitendo[i],value[i]);
			}
		},
		set4chr14segLED:function(str) {
			str = str.toUpperCase();
			var len=0;
			for ( var i = 0 ; i < str.length ; i++){
				var hasDot = false;
				var chrcode = str.charCodeAt(i);
				if ( str[i+1]=="."){
					hasDot = true;
					++i;
				}
				this.set14seg(chrcode,len*16,hasDot);
				++len;
				if (len ==4){break}		}
			if ( len <4){
				for ( var i=len ; i < 4 ; i++){
					this.set14seg(0,i*16,hasDot);
				}
			}
		},
		set14seg:function(chrcode,k,dp){
			var chp=0;
			if(chrcode >=0x30 && chrcode <= 0x39){
				chp = this.chr14seg.number[chrcode - 0x30];
			} else if ( chrcode >=0x41 && chrcode <= 0x5a){
				chp = this.chr14seg.alphabet[chrcode - 0x41];
			}
			for ( var b = 0 ; b < 14 ; b++){
				var l = (chp>>b)&1;
				this.set_led(b + k, l);
			}
			if ( dp ){
				this.set_led(14 + k, 1);
			} else {
				this.set_led(14 + k, 0);
			}
		},
	};

	return HT16K33;

}));
