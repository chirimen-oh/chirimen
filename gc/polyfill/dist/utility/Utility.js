/**
 * Utility function for async/await code.
 * @param {number} ms - milliseconds to wait
 * @return {Promise} A promise to be resolved after ms milliseconds later.
 */
export function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
/**
 * ログ情報出力
 * @param {*} str 出力文字列
 */
export function infoLog(str) {
    // console.log("info: "+str);
}
/**
 * エラーログログ情報出力
 * @param {*} error エラー情報
 */
export function errLog(error) {
    console.error(error);
}
/**
 *　I2C 読み込みエラー処理
 * @param {*} portNumber ポート番号
 * @param {*} slaveAddress スレーブアドレス
 * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
 */
export function printReadError(portNumber, slaveAddress) {
    errLog([
        `i2c-${portNumber}(アドレス: 0x${slaveAddress.toString(16)})`,
        "からの値の取得に失敗しました。",
        "デバイスが正しく認識されており、アドレスに誤りがないことを確認してください。",
    ].join(""));
}
/**
 *　I2C 書き込みエラー処理
 * @param {*} portNumber ポート番号
 * @param {*} slaveAddress スレーブアドレス
 * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
 */
export function printWriteError(portNumber, slaveAddress) {
    errLog([
        `I2C-${portNumber}`,
        `(アドレス: 0x${slaveAddress.toString(16)})`,
        "への値の書き込みに失敗しました。",
        "デバイスが正しく認識されており、アドレスに誤りがないことを確認してください。",
    ].join(" "));
}
//# sourceMappingURL=Utility.js.map