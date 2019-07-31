// based on http://www.widesnow.com/entry/2015/09/10/061128
// https://www.invensense.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf

var MPU6050 = function(i2cPort,slaveAddress){
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if ( slaveAddress ){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress =  0x68;
	}
};

MPU6050.prototype = {
	init: async function(){
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
//        console.log("init ok:"+this.i2cSlave);
		await this.i2cSlave.write8(0x6b,0x00);
		console.log("init ok:"+this.i2cSlave);
	},
	readTemp: async function(){
		if(this.i2cSlave == null){
			throw Error("i2cSlave Address does'nt yet open!");
		}
		var ans = await this.i2cSlave.read16(0x41);
		console.log(ans);
//         var data = ((MSB << 8) + LSB)/128.0;
		var temp = ans / 340 + 36.53;
		return(temp);
	},
	readAll: async function(){
		if(this.i2cSlave == null){
			throw Error("i2cSlave Address does'nt yet open!");
		}
		var ans = await this.i2cSlave.read16(0x41);
//		console.log("tmpW:",ans);
		var temp = this.getVal(ans) / 340 + 36.53;
		ans = await this.i2cSlave.read16(0x43);
		var rx = this.getVal(ans) / 131;
		ans = await this.i2cSlave.read16(0x45);
		var ry = this.getVal(ans) / 131;
		ans = await this.i2cSlave.read16(0x47);
		var rz = this.getVal(ans) / 131;
		ans = await this.i2cSlave.read16(0x3b);
		var gx = this.getVal(ans) / 16384;
		ans = await this.i2cSlave.read16(0x3d);
		var gy = this.getVal(ans) / 16384;
		ans = await this.i2cSlave.read16(0x3f);
		var gz = this.getVal(ans) / 16384;
		console.log("t:",temp,"  rxyz:",rz,ry,rz,"  gxyz:",gx,gy,gz);
		return({
			temperature: temp,
			gx: gx,
			gy: gy,
			gz: gz,
			rx: rx,
			ry: ry,
			rz: rz
		});
	},
	wake: async function(){
		if(this.i2cSlave == null){
			throw Error("i2cSlave Address does'nt yet open!");
		}
		await this.i2cSlave.write8(0x6b,0x00);
	},
	reset: async function(){ // deep sleep?
		if(this.i2cSlave == null){
			throw Error("i2cSlave Address does'nt yet open!");
		}
		await this.i2cSlave.write8(0x6b,0x80);
	},
	getVal: function( w ){
		var l = w >>> 8;
		var b = w & 0xff;
		var v = l + ( b << 8 );
//		console.log("Val:",w.toString(16),b.toString(16),l.toString(16),v.toString(16),b,l,v);
		if ( v >= 0x8000 ){
			return ( - ((65535 - v ) + 1 ) );
		} else {
			return(v);
		}
	}
};