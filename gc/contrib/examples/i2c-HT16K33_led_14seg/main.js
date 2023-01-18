// HT16K33 Sample

main();

async function main() {
	const i2cAccess = await navigator.requestI2CAccess();
	const port = i2cAccess.ports.get(1);
	const ht = new HT16K33(port);
	await ht.init();
	
	//await ht.set_blink(ht.HT16K33_BLINK_1HZ);
	//await ht.set_brightness(6);
	
	while(true){
		// 使用できる文字は、アルファベット、数字、ピリオド
		ht.set4chr14segLED("How");
		await ht.write_display();
		await sleep(1000);
		ht.set4chr14segLED("are");
		await ht.write_display();
		await sleep(1000);
		ht.set4chr14segLED("you.");
		await ht.write_display();
		await sleep(1000);
		ht.set4chr14segLED("3.14");
		await ht.write_display();
		await sleep(1000);
	}
}