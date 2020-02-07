main();

async function main() {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var apds = new APDS9960(port);
    await apds.init();
    await apds.enableLightSensor();
    await apds.enableProximitySensor();
    await apds.setProximityIntLowThreshold(50)
    var amb,pro;
    while (1)
    {
        amb = await apds.readAmbientLight();
        pro = await apds.readProximity();
        document.getElementById("AmbientLight").innerHTML =  amb;
        document.getElementById("Proximity").innerHTML = pro;
        await sleep(200);
    }
}
