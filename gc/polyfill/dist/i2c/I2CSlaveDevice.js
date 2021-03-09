import { errLog, infoLog, printReadError, printWriteError } from '../utility/Utility';
export class I2CSlaveDevice {
    /**
     * GPIOPort constructor 処理
     * @param {*} portNumber ポート番号
     * @param {*} bone TBD
     * ポート情報マッピング
     */
    constructor(portNumber, slaveAddress, bone) {
        this.portNumber = null;
        this.slaveAddress = null;
        this.init(portNumber, slaveAddress, bone);
    }
    /**
     * @function
     *　I2C スレーブデバイス初期化処理　継承
     * @param {*} portNumber ポート番号
     * @param {*} slaveAddress スレーブアドレス
     * @return {*} ポート、デバイス初期化結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    init(portNumber, slaveAddress, bone) {
        this.bone = bone;
        return new Promise((resolve, reject) => {
            this.portNumber = portNumber;
            this.slaveAddress = slaveAddress;
            var data = new Uint8Array([this.slaveAddress, 1]);
            bone.send(0x20, data).then((result) => {
                if (result[0] != 0) {
                    infoLog('I2CSlaveDevice.init() result OK');
                    resolve(this);
                }
                else {
                    errLog(`I2C-${this.portNumber}への接続に失敗しました。`);
                    errLog('I2CSlaveDevice.init() result NG');
                    reject('I2CSlaveDevice.init() result NG:');
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 8bit 読み込み処理
     * @param {*} registerNumber 読み込み番号
     * @return {*} 読み込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    read8(registerNumber) {
        return new Promise((resolve, reject) => {
            var data = new Uint8Array([this.slaveAddress, registerNumber, 1]);
            this.bone.send(0x23, data).then((result) => {
                infoLog('I2CSlaveDevice.read8() result value=' + result);
                var readSize = result[0];
                if (readSize == 1) {
                    resolve(result[1]);
                }
                else {
                    printReadError(this.portNumber, this.slaveAddress);
                    reject('read8() readSize unmatch : ' + readSize);
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 16bit 読み込み処理
    * @param {*} registerNumber 読み込み番号
    * @return {*} 読み込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    read16(registerNumber) {
        return new Promise((resolve, reject) => {
            infoLog('I2CSlaveDevice.read16() registerNumber=' + registerNumber);
            var data = new Uint8Array([this.slaveAddress, registerNumber, 2]);
            this.bone.send(0x23, data).then((result) => {
                infoLog('I2CSlaveDevice.write8() result value=' + result);
                var readSize = result[0];
                if (readSize == 2) {
                    var res_l = result[1];
                    var res_h = result[2];
                    var res = res_l + (res_h << 8);
                    resolve(res);
                }
                else {
                    printReadError(this.portNumber, this.slaveAddress);
                    reject('read16() readSize unmatch : ' + readSize);
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 8bit 書き込み処理
    * @param {*} registerNumber 書き込み番号
    * @param {*} registerNumber 書き込み値
    * @return {*} 書き込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    write8(registerNumber, value) {
        return new Promise((resolve, reject) => {
            infoLog('I2CSlaveDevice.write8() registerNumber=' + registerNumber +
                ' value=' + value);
            var size = 2;
            var data = new Uint8Array([
                this.slaveAddress,
                size,
                registerNumber,
                value,
            ]);
            this.bone.send(0x21, data).then((result) => {
                infoLog('I2CSlaveDevice.write8() result value=' + result);
                if (result[0] != size) {
                    printWriteError(this.portNumber, this.slaveAddress);
                    reject('I2CSlaveAddress(' + this.slaveAddress + ').write8():error');
                }
                else {
                    resolve();
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 16bit 書き込み処理
    * @param {*} registerNumber 書き込み番号
    * @param {*} registerNumber 書き込み値
    * @return {*} 書き込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    write16(registerNumber, value) {
        return new Promise((resolve, reject) => {
            infoLog('I2CSlaveDevice.write16() registerNumber=' + registerNumber +
                ' value=' + value);
            var value_L = value & 0x00ff;
            var value_H = (value >> 8) & 0x00ff;
            var size = 3;
            var data = new Uint8Array([
                this.slaveAddress,
                size,
                registerNumber,
                value_L,
                value_H,
            ]);
            this.bone.send(0x21, data).then((result) => {
                infoLog('I2CSlaveDevice.write16() result value=' + result);
                if (result[0] != size) {
                    printWriteError(this.portNumber, this.slaveAddress);
                    reject('I2CSlaveAddress(' + this.slaveAddress + ').write16():error');
                }
                else {
                    resolve();
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 1byte 読み込み処理
    * @return {*} 読み込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    readByte() {
        return new Promise((resolve, reject) => {
            var data = new Uint8Array([this.slaveAddress, 1]);
            this.bone.send(0x22, data).then((result) => {
                infoLog('I2CSlaveDevice.readByte() result value=' + result);
                var readSize = result[0];
                if (readSize == 1) {
                    resolve(result[1]);
                }
                else {
                    printReadError(this.portNumber, this.slaveAddress);
                    reject('readByte() readSize unmatch : ' + readSize);
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C n byte 読み込み処理
    * @param {*} length 読み込みバイト長
    * @return {*} 読み込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    readBytes(length) {
        return new Promise((resolve, reject) => {
            if (typeof length !== 'number' || length > 127) {
                reject('readBytes() readSize error : ' + length);
            }
            var data = new Uint8Array([this.slaveAddress, length]);
            this.bone.send(0x22, data).then((result) => {
                infoLog('I2CSlaveDevice.readBytes() result value=' + result);
                var readSize = result[0];
                if (readSize == length) {
                    var buffer = result;
                    buffer.shift(); // readSizeを削除
                    resolve(buffer);
                }
                else {
                    printReadError(this.portNumber, this.slaveAddress);
                    reject('readBytes() readSize unmatch : ' + readSize);
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 1byte 書き込み処理
    * @param {*} value 書き込み値
    * @return {*} 書き込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    writeByte(value) {
        return new Promise((resolve, reject) => {
            infoLog('I2CSlaveDevice.writeByte() value=' + value);
            var size = 1;
            var data = new Uint8Array([this.slaveAddress, size, value]);
            this.bone.send(0x21, data).then((result) => {
                infoLog('I2CSlaveDevice.writeByte() result' + result);
                if (result[0] != size) {
                    printWriteError(this.portNumber, this.slaveAddress);
                    reject('I2CSlaveAddress(' + this.slaveAddress + ').writeByte():error');
                }
                else {
                    resolve();
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * @function
     *　I2C 1byte 書き込み処理
    * @param {*} buffer 書き込み値
    * @return {*} 書き込み結果
    * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
    */
    writeBytes(buffer) {
        return new Promise((resolve, reject) => {
            if (buffer.length == null) {
                reject('readBytes() parameter error : ' + buffer);
            }
            var arr = [this.slaveAddress, buffer.length];
            for (var cnt = 0; cnt < buffer.length; cnt++) {
                arr.push(buffer[cnt]);
            }
            var data = new Uint8Array(arr);
            this.bone.send(0x21, data).then((result) => {
                infoLog('I2CSlaveDevice.writeBytes() result value=' + result);
                if (result[0] == buffer.length) {
                    const resbuffer = result;
                    resbuffer.shift(); // readSizeを削除
                    resolve(resbuffer);
                }
                else {
                    printWriteError(this.portNumber, this.slaveAddress);
                    reject('writeBytes() writeSize unmatch : ' + result[0]);
                }
            }, (error) => {
                reject(error);
            });
        });
    }
}
//# sourceMappingURL=I2CSlaveDevice.js.map