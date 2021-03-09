import { errLog, infoLog } from '../utility/Utility';
export class GPIOPort {
    /**
     * GPIOPort constructor 処理
     * @param {*} portNumber ポート番号
     * @param {*} bone TBD
     * ポート情報マッピング
     */
    constructor(portNumber, bone) {
        /** 出力フラグ */
        this.exported = false;
        /** 設定値 */
        this.value = null;
        this.onchange = null;
        this.init(portNumber, bone);
    }
    /**
     * GPIO 初期化処理
     * @param {*} portNumber ポート番号
     * ポート情報マッピング
     */
    init(portNumber, bone) {
        this.portNumber = portNumber;
        this.portName = '';
        this.pinName = '';
        this.direction = '';
        this.exported = false;
        this.value = null;
        this.onchange = null;
        this.bone = bone;
    }
    /**
     * GPIOポート接続処理
     * @param {*} direction 入出力方向情報
     * @return {*} TBD
     */
    export(direction) {
        return new Promise((resolve, reject) => {
            let dir = -1;
            if (direction === 'out') {
                dir = 0;
                this.bone.removeEvent(0x14, this.portNumber);
            }
            else if (direction === 'in') {
                dir = 1;
                // console.dir(bone);
                this.bone.registerEvent(0x14, this.portNumber, (buf) => {
                    if (typeof this.onchange === 'function') {
                        infoLog('onchange');
                        this.onchange(buf[5]);
                    }
                });
            }
            else {
                reject('export:direction not valid! [' + direction + ']');
            }
            infoLog('export: Port:' + this.portNumber + ' direction=' + direction);
            const data = new Uint8Array([this.portNumber, dir]);
            this.bone.send(0x10, data).then((result) => {
                if (result[0] == 0) {
                    errLog([
                        `GPIO${this.portNumber}への接続に失敗しました。`,
                        '他のウィンドウ/タブなど別のプロセスが既に同じピン番号を使用している可能性があります。',
                    ].join(''));
                    reject('GPIOPort(' + this.portNumber + ').export() error');
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
     * GPIO 読み取り処理
     * @return {*} TBD
     */
    read() {
        return new Promise((resolve, reject) => {
            infoLog('read: Port:' + this.portNumber);
            var data = new Uint8Array([this.portNumber]);
            this.bone.send(0x12, data).then((result) => {
                if (result[0] == 0) {
                    errLog(`GPIO${this.portNumber}から値の取得に失敗しました。`);
                    reject('GPIOPort(' + this.portNumber + ').read() error');
                }
                else {
                    resolve(result[1]);
                }
            }, (error) => {
                reject(error);
            });
        });
    }
    /**
     * GPIO 書き込み処理
     * @param {*} value 書き込みデータ
     * @return {*} TBD
     */
    write() {
        return new Promise((resolve, reject) => {
            infoLog('write: Port:' + this.portNumber + ' value=' + this.value);
            var data = new Uint8Array([this.portNumber, this.value]);
            this.bone.send(0x11, data).then((result) => {
                if (result[0] == 0) {
                    errLog(`GPIO${this.portNumber}に値の設定に失敗しました。`);
                    reject('GPIOPort(' + this.portNumber + ').write() error');
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
     * GPIOポート開放処理
     * @return {*} TBD
     */
    unexport() {
        return new Promise((resolve, reject) => {
            infoLog('unexport: Port:' + this.portNumber);
            var data = new Uint8Array([this.portNumber, this.value]);
            this.bone.send(0x13, data).then((result) => {
                if (result[0] == 0) {
                    errLog(`GPIO${this.portNumber}の開放に失敗しました。`);
                    reject('GPIOPort(' + this.portNumber + ').unexport() error');
                }
                else {
                    resolve();
                }
            }, (error) => {
                reject(error);
            });
        });
    }
}
//# sourceMappingURL=GPIOPort.js.map