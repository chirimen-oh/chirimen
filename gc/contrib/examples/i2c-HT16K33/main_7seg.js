// HT16K33 Sample

main();

async function set4digitLED(ht,num,deg){
	ht.set4digitLED(num,deg);
	await ht.write_display();
}

async function main() {
	const i2cAccess = await navigator.requestI2CAccess();
	const port = i2cAccess.ports.get(1);
	const ht = new HT16K33(port);
	await ht.init();

	//await ht.set_blink(ht.HT16K33_BLINK_1HZ);
	//await ht.set_brightness(6);

	while (true) {
		ht.clear();
		await ht.write_display();
		await sleep(1000);
		await set4digitLED(ht, 0, 3);
		await sleep(1000);
		await set4digitLED(ht, 0.003, 3);
		await sleep(1000);
		await set4digitLED(ht, 0.023, 3);
		await sleep(1000);
		await set4digitLED(ht, 0.123, 3);
		await sleep(1000);
		await set4digitLED(ht, 2.0, 3);
		await sleep(1000);
		await set4digitLED(ht, 0.0, 2);
		await sleep(1000);
		await set4digitLED(ht, 0.05, 2);
		await sleep(1000);
		await set4digitLED(ht, 0.25, 2);
		await sleep(1000);
		await set4digitLED(ht, 1.25, 2);
		await sleep(1000);
		await set4digitLED(ht, 10.25, 2);
		await sleep(1000);
		await set4digitLED(ht, 2001.25, 2);
		await sleep(1000);
		await set4digitLED(ht, 20210.25);
		await sleep(1000);
		await set4digitLED(ht, 0);
		await sleep(1000);
		for (var i = 0; i < 1; i += 0.01) {
			await set4digitLED(ht, i, 2);
			await sleep(10);
		}
		for (var i = 0; i < 10; i += 0.11) {
			await set4digitLED(ht, i, 2);
			await sleep(10);
		}
		for (var i = 0; i < 100; i += 3) {
			await set4digitLED(ht, i);
			await sleep(10);
		}
		for (var i = 100; i < 10000; i += 300) {
			await set4digitLED(ht, i);
			await sleep(10);
		}
	}
}
