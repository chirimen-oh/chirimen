import { GPIOPort } from './GPIOPort';
export class GPIOAccess {
    constructor(bone) {
        /** Raspberry Pi Pin Assign */
        this.gpioPorts = [
            4,
            17,
            18,
            27,
            22,
            23,
            24,
            25,
            5,
            6,
            12,
            13,
            19,
            16,
            26,
            20,
            21,
        ];
        this.ports = new Map();
        this.init(bone);
    }
    /**
     * GPIOAccess 初期化処理
     * ポート情報マッピング
     */
    init(bone) {
        this.ports = new Map();
        this.gpioPorts.forEach((port) => {
            this.ports.set(port, new GPIOPort(port, bone));
        });
    }
}
//# sourceMappingURL=GPIOAccess.js.map