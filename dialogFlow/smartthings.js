/*
  This is the "master" webhook to process _all_ intents from DialogFlow
*/

'use strict';

const https = require('https');
const host = 'api.smartthings.com';
const token = '8cfc63f8-e342-4607-9797-09ee094b2970';
var fulfillmentText;

exports.light = (capability, value) => {

  return new Promise((resolve, reject) => {
    
    const device = 'eeb62d1e-ae4d-4124-ae65-f42c97134e2e'; // which light

    var command, argument;
    const colors = require('./colors.js');

    switch (capability) {
      case "switch":
        command = value;
        fulfillmentText = `Turning the light ${command}`;
        break;
      case "color":
        capability = 'colorControl';
        command = 'setColor';
        argument = colors.tohs(value);
        fulfillmentText = `Turning the light ${value}`;
        break;
      case "brightness":
        capability = 'switchLevel';
        command = 'setLevel';
        argument = [ value ];
        fulfillmentText = `Setting brightness to ${value}`;
        break;
    }

    commandSmartThings(device, capability, command, argument).then( () => {
      resolve ({ 'fulfillmentText': fulfillmentText });
    }).catch((error) => {
      resolve ({ 'fulfillmentText': error }); // want to resolve to minimize code
    }); // end smartThings
  
  }); // end Promise

}; // end light

function commandSmartThings (device, capability, command, argument = null) {

  return new Promise((resolve, reject) => {

    let path = '/v1/devices/' + device + '/commands';
    let payload = {
      "commands": [
        {
          "component": "main",
          "capability": capability,
          "command": command
        }
      ]
    }

    if (argument) {
      payload.commands[0].arguments = argument;
    }

    let body = JSON.stringify(payload);

    let options = {
      host: host,
      path: path,
      headers: {
        'Authorization': 'Bearer: ' + token,
        'Content-Length': Buffer.byteLength(body)
      },
      method: 'POST'
    } // end options

    const request = https.request(options, function(res) {
      let body = '';
      if (res.statusCode != '200') {
        reject(`Error calling the Smarthings API: Status ${res.statusCode}`);
      }
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        resolve(body);
      });
    }); // end request

    request.on('error', (error) => {
      console.log(`Error calling the Smarthings API: ${error}`)
      reject(`Error calling the Smarthings API: ${error}`);
    });

    request.write(body);

  }); // end Promise
} // end commandSmartThings
