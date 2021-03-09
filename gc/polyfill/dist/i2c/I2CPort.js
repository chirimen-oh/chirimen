export class I2CPort {
    /**
     * I2CPort constructor 処理
     * @param {*} portNumber ポート番号
     * @param {*} bone TBD
     * ポート情報マッピング
     */
    constructor(portNumber, bone) {
        /** ポート番号 */
        this.portNumber = 0;
        this.init(portNumber, bone);
    }
    init(portNumber, bone) {
        this.portNumber = portNumber;
        this.bone = bone;
    }
    /**
     * @function
     * I2C ポート open 処理
     * @param {*} slaveAddress スレーブアドレス
     */
    open(slaveAddress) {
        return new Promise((resolve, reject) => {
            // new I2CSlaveDevice(this.portNumber, slaveAddress).then(
            //   (i2cslave) => {
            //     resolve(i2cslave);
            //   },
            //   (err) => {
            //     reject(err);
            //   }
            // );
        });
    }
}
//# sourceMappingURL=I2CPort.js.map