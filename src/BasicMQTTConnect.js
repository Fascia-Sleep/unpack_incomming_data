import React, { useState } from 'react';
import mqtt from 'mqtt';
import './BasicMQTTConnect.css';

// Constants for parsing
const VALIDATION_BITS_IDC = 1;
const VALIDATION_BITS_VAA = 1;
const VALIDATION_BITS_ADS = 8;
const VALIDATION_BITS_IMU = 6;
const VALIDATION_BITS_EDA = 1;
const VALIDATION_BITS_TEM = 1;
const VALIDATION_BITS_PPG = 1;

const VALIDATION_INDEX_SRT = 0;
const VALIDATION_INDEX_IDC = VALIDATION_INDEX_SRT;
const VALIDATION_INDEX_VAA = VALIDATION_INDEX_IDC + VALIDATION_BITS_IDC;
const VALIDATION_INDEX_ADS = VALIDATION_INDEX_VAA + VALIDATION_BITS_VAA;
const VALIDATION_INDEX_IMU = VALIDATION_INDEX_ADS + VALIDATION_BITS_ADS;
const VALIDATION_INDEX_EDA = VALIDATION_INDEX_IMU + VALIDATION_BITS_IMU;
const VALIDATION_INDEX_TEM = VALIDATION_INDEX_EDA + VALIDATION_BITS_EDA;
const VALIDATION_INDEX_PPG = VALIDATION_INDEX_TEM + VALIDATION_BITS_TEM;

const channelTypes = [
  { name: "packet_number", type: "int" },
  { name: "validity_number", type: "int" },
  { name: "ads_1", type: "int" }, // Pz
  { name: "ads_2", type: "int" }, // Cz
  { name: "ads_3", type: "int" }, // Fp1
  { name: "ads_4", type: "int" }, // Fp2
  { name: "ads_5", type: "int" }, // EMG1
  { name: "ads_6", type: "int" }, // EMG2
  { name: "ads_7", type: "int" }, // EOG1
  { name: "ads_8", type: "int" }, // EOG2
  { name: "imu_1", type: "short" },
  { name: "imu_2", type: "short" },
  { name: "imu_3", type: "short" },
  { name: "imu_4", type: "short" },
  { name: "imu_5", type: "short" },
  { name: "imu_6", type: "short" },
  { name: "eda", type: "int" },
  { name: "temp", type: "int" },
  { name: "ppg", type: "int" },
  { name: "board_timestamp", type: "int" }
];

const gains = [
  { name: "ads_1", gain: "2" },
  { name: "ads_2", gain: "2" },
  { name: "ads_3", gain: "12" },
  { name: "ads_4", gain: "12" },
  { name: "ads_5", gain: "4" },
  { name: "ads_6", gain: "4" },
  { name: "ads_7", gain: "4" },
  { name: "ads_8", gain: "4" }
];

const Vref = 4.5;

const BasicMQTTConnect = () => {
  const [macAddress, setMacAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isStreaming, setIsStreaming] = useState(false);

  const mqttConfig = {
    hostname: 'fascia.dev',
    port: 8085,
    protocol: 'wss'
  };

  const interpret24bitAsInt32 = (value) => {
    let mask = (1 << 24) - 1;
    if (value & 0x800000) {
      return ~(value ^ mask);
    } else {
      return value;
    }
  };

  const convertADCuV = (value, gain, Vref) => {
    return value * ((Vref * 1e6) / (gain * ((1 << 23) - 1)));
  };

  const parseData = (message) => {
    const data = new Uint8Array(message);
    const buffer = data.buffer;
    const dataView = new DataView(buffer);
    const ByteCount = 68;
    const packet_time = Date.now() / 1000.0;

    try {
      let newStartPt = 0;
      let parsedData = {};

      for (let i = 0; i < channelTypes.length; i++) {
        if (channelTypes[i].type === "int") {
          if (channelTypes[i].name.startsWith('ads_')) {
            const rawValue = dataView.getInt32(newStartPt, true);
            const gainInfo = gains.find(g => g.name === channelTypes[i].name);
            const value = convertADCuV(
              interpret24bitAsInt32(rawValue),
              gainInfo.gain,
              Vref
            );
            parsedData[channelTypes[i].name] = value;
            newStartPt += 4;
          } else {
            parsedData[channelTypes[i].name] = dataView.getInt32(newStartPt, true);
            newStartPt += 4;
          }
        } else if (channelTypes[i].type === "short") {
          parsedData[channelTypes[i].name] = dataView.getInt16(newStartPt, true);
          newStartPt += 2;
        }
      }

      return Object.entries(parsedData)
        .map(([key, value]) => {
          if (key.startsWith('ads_')) {
            return `${key}: ${value.toFixed(2)}µV`;
          } else if (key === 'temp') {
            return `${key}: ${(value/1000.0).toFixed(2)}°C`;
          } else {
            return `${key}: ${value}`;
          }
        })
        .join('\n');

    } catch (error) {
      console.error('Error parsing data:', error);
      return 'Error parsing data';
    }
  };

  const sendCommand = (command) => {
    if (client && macAddress) {
      const topic = `/PortalMessages_${macAddress}`;
      console.log(`Sending command ${command} to topic: ${topic}`);
      client.publish(topic, command, { qos: 2 }, (error) => {
        if (error) {
          console.error('Error sending command:', error);
        } else {
          console.log(`Command ${command} sent successfully`);
          if (command === 'H') {
            setIsStreaming(false);
          } else if (command === 'D') {
            setIsStreaming(true);
          }
        }
      });
    }
  };

  const startDataStream = () => {
    sendCommand('D'); // R for Run
  };

  const stopDataStream = () => {
    sendCommand('H'); // D for Default/Stop
  };

  const handleConnect = async () => {
    if (!macAddress) {
      setConnectionStatus('Error: MAC address required');
      return;
    }

    try {
      setConnectionStatus('Attempting to connect...');

      const brokerUrl = `${mqttConfig.protocol}://${mqttConfig.hostname}:${mqttConfig.port}/mqtt`;
      console.log('Connecting to broker:', brokerUrl);

      const mqttClient = mqtt.connect(brokerUrl, {
        clientId: `mqtt_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000
      });

      mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        setConnectionStatus('Connected to broker');
        setIsConnected(true);

        const topic = `fascia_${macAddress}`;
        console.log('Subscribing to topic:', topic);

        mqttClient.subscribe(topic, (err) => {
          if (err) {
            console.error('Subscription error:', err);
            setConnectionStatus(`Subscription error: ${err.message}`);
          } else {
            console.log(`Subscribed to ${topic}`);
            setConnectionStatus(`Connected and subscribed to ${topic}`);
          }
        });
      });

      mqttClient.on('message', (topic, message) => {
        try {
          const parsedMessage = parseData(message);
          setMessages(prev => [...prev, parsedMessage]);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT error:', err);
        setConnectionStatus(`MQTT error: ${err.message}`);
        setIsConnected(false);
        setIsStreaming(false);
      });

      mqttClient.on('close', () => {
        console.log('MQTT connection closed');
        setConnectionStatus('Connection closed');
        setIsConnected(false);
        setIsStreaming(false);
      });

      setClient(mqttClient);

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus(`Connection error: ${error.message}`);
      setIsConnected(false);
      setIsStreaming(false);
    }
  };

  const handleDisconnect = () => {
    if (client) {
      if (isStreaming) {
        stopDataStream();
      }
      console.log('Disconnecting...');
      client.end();
      setClient(null);
      setIsConnected(false);
      setMessages([]);
      setConnectionStatus('Disconnected');
      setIsStreaming(false);
    }
  };

  return (
    <div className="mqtt-container">
      <div className="mqtt-card">
        <h2>MQTT Connection</h2>

        <div className="status-indicator">
          Status: {connectionStatus}
        </div>

        <div className="input-group">
          <label htmlFor="macAddress">Device MAC Address</label>
          <input
            id="macAddress"
            type="text"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
            placeholder="Enter MAC address"
            disabled={isConnected}
          />
        </div>

        <div className="broker-info">
          <p>Broker: {mqttConfig.hostname}:{mqttConfig.port}</p>
          <p>Protocol: {mqttConfig.protocol}</p>
          {macAddress && <p>Topic: fascia_{macAddress}</p>}
        </div>

        <div className="button-group">
          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            className={isConnected ? 'button-disconnect' : 'button-connect'}
          >
            {isConnected ? 'Disconnect' : 'Connect to Mask'}
          </button>

          {isConnected && (
            <button
              onClick={isStreaming ? stopDataStream : startDataStream}
              className={isStreaming ? 'button-stop-stream' : 'button-start-stream'}
            >
              {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </button>
          )}
        </div>

        <div className="messages-container">
          <label>Messages ({messages.length})</label>
          <div className="messages-box">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <pre>{msg}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicMQTTConnect;