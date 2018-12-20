// Driver for https://github.com/usedbytes/neopixel_i2c
// Programmed by Satoru Takagi

var NEOPIXEL_I2C = function(i2cPort,slaveAddress){
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if ( slaveAddress ){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress = 0x41;
	}
	this.N_LEDS = 160;
	this.GLOBALMODE = false;
	this.pixRegStart = 0x04;
};

NEOPIXEL_I2C.prototype = {
	sleep: function(ms){
		return new Promise((resolve)=>{setTimeout(resolve,ms);});
	},
	init: async function(N_LEDS){
		if ( N_LEDS ){
			this.N_LEDS = N_LEDS;
		}
		
		var i2cSlave = await this.i2cPort.open(this.slaveAddress);
		this.i2cSlave = i2cSlave;
		
		await this.i2cSlave.write8(0x00,0x01); // reset
		/**
		await this.i2cSlave.write8(0x01,0x20); // global color set dim white
		await this.i2cSlave.write8(0x02,0x20); 
		await this.i2cSlave.write8(0x03,0x20); 
		for ( var i = 0 ; i < this.N_LEDS ; i++ ){
			await setPixel(i , 0, 0, 0);
		}
		**/
	},
	setPixel: async function(pixelNumber,red,green,blue){
		if ( this.GLOBALMODE ){
			await this.i2cSlave.write8(0x00,0x01);
			this.GLOBALMODE = false;
		}
		if(this.i2cSlave == null){
			throw Error("i2cSlave Address does'nt yet open!");
		}
		if ( pixelNumber < 0 || pixelNumber >= this.N_LEDS){
			throw Error("pixelNumber should be 0 to "+(this.N_LEDS-1));
		}
		await this.i2cSlave.write8( pixelNumber * 3 + this.pixRegStart , green & 0xff );
		await this.i2cSlave.write8( pixelNumber * 3 + 1 + this.pixRegStart , red & 0xff );
		await this.i2cSlave.write8( pixelNumber * 3 + 2 + this.pixRegStart , blue& 0xff );
	},
	setPixels: async function(rgbArray,startPixel){
		if (rgbArray.length/3 + startPixel >this.N_LEDS){
			throw Error("pixelNumber overflow : rgbArray.length , startPixel , this.N_LEDS: " + rgbArray.length +","+ startPixel +","+ this.N_LEDS );
		}
		var startAddr = this.pixRegStart;
		if (startPixel){
			startAddr += startPixel*3;
		}
		
		if ( this.GLOBALMODE ){
			await this.i2cSlave.write8(0x00,0x01);
			this.GLOBALMODE = false;
		}
		
		var data = [];
		data.push(startAddr);
		for ( var i = 0 ; i <rgbArray.length ; i++){
			data.push(rgbArray[i]);
			if ( startAddr + i == 254 ){ // レジスタとして見えるピクセルの末尾でいったん書き出し(polifill srvのuint8バグ回避
				await this.i2cSlave.writeBytes(data);
				data = [];
				data.push(255); // 末尾ギリギリからさらに書き出す
			}
		}
		await this.i2cSlave.writeBytes(data);
	},
	setGlobal: async function(red,green,blue){
		await this.i2cSlave.write8( 1 , green & 0xff );
		await this.i2cSlave.write8( 2 , red & 0xff );
		await this.i2cSlave.write8( 3 , blue& 0xff );
		if ( !this.GLOBALMODE ){
			await this.i2cSlave.write8(0x00,0x02);
			this.GLOBALMODE = true;
		}
	}
};