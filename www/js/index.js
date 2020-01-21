var battery = {
    service: "180F",
    level: "2A19"
};

var app = {
    initialize: function() {
        app.log("initialize... ");
        this.bindEvents();
        // this.checkPermissions();
        detailPage.hidden = true;
    },
    bindEvents: function() {
        app.log("bindEvents... ");
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        batteryStateButton.addEventListener('touchstart', this.readBatteryState, false);
        disconnectButton.addEventListener('touchstart', this.disconnect, false);
        deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
    },
    checkPermissions: function() {
        app.log("checkPermissions... ");
        var permissions = cordova.plugins.permissions;
        permissions.hasPermission(permissions.ACCESS_COARSE_LOCATION, function( status ){
            if ( status.hasPermission ) {
                app.log("hasPermission Yes :D ");
            } else {
                app.log("hasPermission No :( ");
                permissions.requestPermission(permissions.ACCESS_COARSE_LOCATION, requestPermissionSuccess, requestPermissionError);
            }
        });
    },
    onDeviceReady: function() {
        app.log("onDeviceReady... ");
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        app.log("refreshDeviceList... ");
        $("#deviceList").html("empty");
        // scan for all devices
        ble.scan([], 15, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {
        app.log("onDiscoverDevice... ");
        var advertisingData = parseAdvertisingData(device.advertising);

        app.log(JSON.stringify(device));
        app.log(JSON.stringify(advertisingData));

        var listItem = document.createElement('li'),
            html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                device.id;

        listItem.dataset.deviceId = device.id;  // TODO
        listItem.innerHTML = html;
        $("#deviceList").append(listItem);

    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId,
            onConnect = function() {

                // TODO check if we have the battery service
                // TODO check if the battery service can notify us
                //ble.startNotification(deviceId, battery.service, battery.level, app.onBatteryLevelChange, app.onError);
                batteryStateButton.dataset.deviceId = deviceId;
                disconnectButton.dataset.deviceId = deviceId;
                app.showDetailPage();
            };

        ble.connect(deviceId, onConnect, app.onError);
    },
    onBatteryLevelChange: function(data) {
        app.log(data);
        var message;
        var a = new Uint8Array(data);

        $("#batteryState").html(a[0]);
    },
    readBatteryState: function(event) {
        app.log("readBatteryState");
        var deviceId = event.target.dataset.deviceId;
        ble.read(deviceId, battery.service, battery.level, app.onReadBatteryLevel, app.onError);
    },
    onReadBatteryLevel: function(data) {
        app.log(data);
        var message;
        var a = new Uint8Array(data);
        $("#batteryState").html(a[0]);
    },
    disconnect: function(event) {
        var deviceId = event.target.dataset.deviceId;
        ble.disconnect(deviceId, app.showMainPage, app.onError);
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onError: function(reason) {
        $("#log").append("<p>"+ "ERROR: " + reason +"</p>");
    },
    log: function(text){
        $("#log").append("<p>"+ text +"</p>");
    }
};


function parseAdvertisingData(buffer) {
    var length, type, data, i = 0, advertisementData = {};
    var bytes = new Uint8Array(buffer);

    while (length !== 0) {

        length = bytes[i] & 0xFF;
        i++;

        // decode type constants from https://www.bluetooth.org/en-us/specification/assigned-numbers/generic-access-profile
        type = bytes[i] & 0xFF;
        i++;

        data = bytes.slice(i, i + length - 1).buffer; // length includes type byte, but not length byte
        i += length - 2;  // move to end of data
        i++;

        advertisementData[asHexString(type)] = data;
    }

    return advertisementData;
}

function asHexString(i) {
    var hex;

    hex = i.toString(16);

    // zero padding
    if (hex.length === 1) {
        hex = "0" + hex;
    }

    return "0x" + hex;
}