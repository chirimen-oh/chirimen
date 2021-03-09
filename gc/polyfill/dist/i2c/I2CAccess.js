import { I2CPort } from './I2CPort';
export class I2CAccess {
    constructor(bone) {
        this.i2cPorts = [1];
        this.ports = new Map();
        this.init(bone);
    }
    /**
     * I2CAccess 初期化処理
     * ポート情報マッピング
     */
    init(bone) {
        this.ports = new Map();
        this.i2cPorts.forEach((i2cPort) => this.ports.set(i2cPort, new I2CPort(i2cPort, bone)));
    }
}
//# sourceMappingURL=I2CAccess.js.map