// HT16K33 Sample

main();

const iconPattern =[
0,0,1,1,1,1,0,0,
0,1,0,0,0,0,1,0,
1,0,1,0,0,1,0,1,
1,0,0,0,0,0,0,1,
1,0,1,0,0,1,0,1,
1,0,0,1,1,0,0,1,
0,1,0,0,0,0,1,0,
0,0,1,1,1,1,0,0,
]; // スマイルマーク

const iconPattern2 =[
1,0,0,0,0,0,0,1,
0,1,0,0,0,0,1,0,
0,0,1,1,1,1,0,0,
0,1,1,1,1,1,1,0,
1,1,0,1,1,0,1,1,
0,1,1,1,1,1,1,0,
0,0,1,0,0,1,0,0,
1,1,0,0,0,0,1,1
]; // インベーダー

const iconPattern3 =[
0,1,0,0,0,0,1,0,
1,1,1,1,1,1,1,0,
1,0,0,1,0,0,1,0,
1,1,0,1,1,0,1,0,
1,0,0,1,0,0,1,0,
1,1,1,1,1,1,1,0,
0,1,1,1,1,1,1,1,
0,1,0,1,0,1,0,1
]; // 犬

async function main() {
	const i2cAccess = await navigator.requestI2CAccess();
	const port = i2cAccess.ports.get(1);
	const ht = new HT16K33(port);
	await ht.init();
	
	//await ht.set_blink(ht.HT16K33_BLINK_1HZ);
	//await ht.set_brightness(6);
	
	while(true){
		ht.set_8x8_array(iconPattern);
		await ht.write_display();
		await sleep(1000);
		
		ht.set_8x8_array(iconPattern2);
		await ht.write_display();
		await sleep(1000);
		
		ht.set_8x8_array(iconPattern3);
		await ht.write_display();
		await sleep(1000);
		
		/** LEDを一個づつ設定する関数の使用例
		for ( var i = 0 ; i < 128 ; i++ ){
			ht.set_led(i, 1);
		}
		await ht.write_display();
		await sleep(1000);
		**/
	}
}