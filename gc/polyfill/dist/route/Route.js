import { errLog, infoLog } from '../utility/Utility';
/**
 * ステータス用 enum
 * @enum {number}
 */
var StatusEnum;
(function (StatusEnum) {
    StatusEnum[StatusEnum["init"] = 0] = "init";
    StatusEnum[StatusEnum["waitConnection"] = 1] = "waitConnection";
    StatusEnum[StatusEnum["connected"] = 2] = "connected"; // connected
})(StatusEnum || (StatusEnum = {}));
export class Route {
    constructor(serverURL) {
        this.wss = null;
        this.queue = null; // function queue
        this.onevents = null; // onevent queue
        this.waitQueue = null;
        this.status = StatusEnum.init;
        this.session = 0;
        this.init(serverURL);
    }
    /**
     * GPIO 初期化処理
     * @param {*} serverURL WebSocket サーバーURL
     */
    init(serverURL) {
        infoLog('bone.init()');
        this.waitQueue = new Array();
        this.queue = new Map();
        this.onevents = new Map();
        this.wss = new WebSocket(serverURL);
        this.wss.binaryType = 'arraybuffer';
        this.status = StatusEnum.waitConnection;
        this.wss.onopen = () => {
            infoLog('onopen');
            for (let cnt = 0; cnt < this.waitQueue.length; cnt++) {
                if (typeof this.waitQueue[cnt] === 'function') {
                    this.waitQueue[cnt](true);
                }
            }
            this.status = StatusEnum.connected;
            this.waitQueue = [];
        };
        this.wss.onerror = (error) => {
            errLog(error);
            errLog([
                'Node.jsプロセスとの接続に失敗しました。',
                'CHIRIMEN for Raspberry Piやその互換環境でのみ実行可能です。',
                'https://r.chirimen.org/tutorial',
            ].join('\n'));
            const length = this.waitQueue ? this.waitQueue.length : 0;
            for (let cnt = 0; cnt < length; cnt++) {
                if (typeof this.waitQueue[cnt] === 'function') {
                    this.waitQueue[cnt](false);
                }
            }
            this.status = StatusEnum.init;
            this.waitQueue = [];
        };
        this.wss.onmessage = (mes) => {
            const buffer = new Uint8Array(mes.data);
            infoLog('on message:' + buffer);
            if (buffer[0] == 1) {
                this.receive(buffer);
            }
            else if (buffer[0] == 2) {
                this.onEvent(buffer);
            }
        };
    }
    /**
     * @function
     * GPIO データ送信処理
     * @param {*} func 送信先アドレス
     * @param {*} data 送信処理
     */
    send(func, data) {
        return new Promise((resolve, reject) => {
            if (!(data instanceof Uint8Array)) {
                reject('type error: Please using with Uint8Array buffer.');
                return;
            }
            const length = data.length + 4;
            let buf = new Uint8Array(length);
            buf[0] = 1; // 1: API Request
            buf[1] = this.session & 0x00ff; // session LSB
            buf[2] = this.session >> 8; // session MSB
            buf[3] = func;
            for (let cnt = 0; cnt < data.length; cnt++) {
                buf[4 + cnt] = data[cnt];
            }
            infoLog('send message:' + buf);
            this.queue.set(this.session, (data) => {
                resolve(data);
            });
            this.wss.send(buf);
            buf = null;
            this.session++;
            if (this.session > 0xffff) {
                this.session = 0;
            }
        });
    }
    /**
     * @function
     * GPIO データ受信処理
     * @param {*} mes 受信メッセージ
     */
    receive(mes) {
        if (!(mes instanceof Uint8Array)) {
            errLog(new TypeError('Please using with Uint8Array buffer.'));
            errLog(new TypeError([
                'Uint8Array以外を受信しました。',
                'Node.jsのプロセスに何らかの内部的な問題が生じている可能性があります。',
            ].join('')));
            return;
        }
        const session = (mes[1] & 0x00ff) | (mes[2] << 8);
        const func = this.queue.get(session);
        if (typeof func === 'function') {
            infoLog('result');
            const data = new Array();
            for (let cnt = 0; cnt < mes.length - 4; cnt++) {
                data.push(mes[4 + cnt]);
            }
            func(data);
            this.queue.delete(session);
        }
        else {
            errLog(new TypeError('session=' + session + ' func=' + func));
            errLog(new TypeError([
                '受信処理中に問題が発生しました。',
                '他のウィンドウ/タブなど別のプロセスと競合していないことを確認してください。',
            ].join('')));
        }
    }
    /**
     * @function
     * GPIO イベント登録処理
     * @param {*} f 登録アドレス
     * @param {*} port ポート番号
     * @param {*} func 登録バッファ
     */
    registerEvent(f, port, func) {
        const key = (f << 8) | port;
        this.onevents.set(key, func);
    }
    /**
     * @function
     * GPIO イベント削除処理
     * @param {*} f 登録アドレス
     * @param {*} port ポート番号
     * @param {*} func 登録バッファ
     */
    removeEvent(f, port) {
        const key = (f << 8) | port;
        this.onevents.delete(key);
    }
    /**
     * GPIO イベント発生時処理
     * @param {*} data データ
     */
    onEvent(data) {
        if (!(data instanceof Uint8Array)) {
            errLog(new TypeError('Please using with Uint8Array buffer.'));
            errLog(new TypeError([
                'Uint8Array以外を受信しました。',
                'Node.jsのプロセスに何らかの内部的な問題が生じている可能性があります。',
            ].join('')));
            return;
        }
        // [0] Change Callback (2)
        // [1] session id LSB (0)
        // [2] session id MSB (0)
        // [3] function id (0x14)
        // [4] Port Number
        // [5] Value (0:LOW 1:HIGH)
        let key = data[3];
        key = (key << 8) | data[4];
        const func = this.onevents.get(key);
        if (typeof func === 'function') {
            infoLog('onevent');
            func(data);
        }
    }
    /**
     * GPIO接続待ち処理
     */
    waitConnection() {
        return new Promise((resolve, reject) => {
            if (this.status == StatusEnum.connected) {
                resolve();
            }
            else if (this.status == StatusEnum.init) {
                reject();
            }
            else {
                this.waitQueue.push((result) => {
                    if (result == true) {
                        resolve();
                    }
                    else {
                        reject();
                    }
                });
            }
        });
    }
}
//# sourceMappingURL=Route.js.map