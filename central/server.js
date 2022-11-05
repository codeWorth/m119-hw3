// based on the example on https://www.npmjs.com/package/@abandonware/noble

const uuid_service = "1101"
const uuid_value_forward_x = "2101"
const uuid_value_forward_y = "2102"
const uuid_value_forward_z = "2103"
const uuid_value_up_x = "2104"
const uuid_value_up_y = "2105"
const uuid_value_up_z = "2106"

let forward_x_val = undefined;
let forward_y_val = undefined;
let forward_z_val = undefined;
let up_x_val = undefined;
let up_y_val = undefined;
let up_z_val = undefined;

let data = undefined;

const storeData = () => {
  if (forward_x_val === undefined || forward_y_val === undefined || forward_z_val === undefined) return;
  if (up_x_val === undefined || up_y_val === undefined || up_z_val === undefined) return;

  data = {
    forward_x: forward_x_val,
    forward_y: forward_y_val,
    forward_z: forward_z_val,
    up_x: up_x_val,
    up_y: up_y_val,
    up_z: up_z_val
  };

  forward_x_val = undefined;
  forward_y_val = undefined;
  forward_z_val = undefined;
  up_x_val = undefined;
  up_y_val = undefined;
  up_z_val = undefined;
};

const noble = require('@abandonware/noble');

noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    console.log("start scanning")
    await noble.startScanningAsync([uuid_service], false);
  }
});

noble.on('discover', async (peripheral) => {
  if (peripheral.advertisement.localName != "Andrew Arduino") {
    console.log("Ignoring", peripheral.advertisement.localName);
    return
  } else {
    console.log("Connecting to", peripheral.advertisement.localName);
  }

  await noble.stopScanningAsync();
  await peripheral.connectAsync();
  const {characteristics} = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
    [uuid_service], 
    [
      uuid_value_forward_x, uuid_value_forward_y, uuid_value_forward_z,
      uuid_value_up_x, uuid_value_up_y, uuid_value_up_z
    ]
  );

  const forward_x_char = characteristics.find(c => c.uuid == uuid_value_forward_x);
  const forward_y_char = characteristics.find(c => c.uuid == uuid_value_forward_y);
  const forward_z_char = characteristics.find(c => c.uuid == uuid_value_forward_z);
  const up_x_char = characteristics.find(c => c.uuid == uuid_value_up_x);
  const up_y_char = characteristics.find(c => c.uuid == uuid_value_up_y);
  const up_z_char = characteristics.find(c => c.uuid == uuid_value_up_z);

  forward_x_char.subscribe();
  forward_y_char.subscribe();
  forward_z_char.subscribe();
  up_x_char.subscribe();
  up_y_char.subscribe();
  up_z_char.subscribe();

  console.log("Connected!");

  forward_x_char.on('read', (data) => {
    forward_x_val = data.readFloatLE();
    storeData();
  });
  forward_y_char.on('read', (data) => {
    forward_y_val = data.readFloatLE();
    storeData();
  });
  forward_z_char.on('read', (data) => {
    forward_z_val = data.readFloatLE();
    storeData();
  });

  up_x_char.on('read', (data) => {
    up_x_val = data.readFloatLE();
    storeData();
  });
  up_y_char.on('read', (data) => {
    up_y_val = data.readFloatLE();
    storeData();
  });
  up_z_char.on('read', (data) => {
    up_z_val = data.readFloatLE();
    storeData();
  });
});

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3001 });

const sendData = (ws) => {
  return () => {
    if (data === undefined) return;
    ws.send(JSON.stringify(data));
  };
}

wss.on('connection', function connection(ws) {
  setInterval(sendData(ws), 50);
});

const fs = require('fs');
const http = require('http');

http.createServer(function (req, res) {
  fs.readFile(__dirname + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(3000);