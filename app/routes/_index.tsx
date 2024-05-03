import type { MetaFunction } from "@remix-run/node";
import mqtt, { MqttClient } from "mqtt";
import { useEffect, useState } from "react";

const MQTT_BROKER_URL = "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = "test/topic";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix SPA" },
    { name: "description", content: "Welcome to Remix (SPA Mode)!" },
  ];
};

export default function Index() {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [receivedMessage, setReceivedMessage] = useState<string>("");

  useEffect(() => {
    const connectToMqtt = () => {
      // MQTTクラアント
      const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
        clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      // ブローカーに接続
      // NOTE: 接続に関するエラーハンドリングは？
      mqttClient.on("connect", () => {
        setClient(mqttClient);
        setIsConnected(true);
        console.log("Connected to MQTT broker");

        // サブスクライブ
        // NOTE: 前段でsetClientでclientにmqttClientセットしているし、clientで良いのでは？
        mqttClient.subscribe(MQTT_TOPIC, (err) => {
          if (err) {
            console.error("Failed to subscribe:", err);
          } else {
            console.log("subscribed to topic:", MQTT_TOPIC);
          }
        });
      });

      // メッセージ受信
      mqttClient.on("message", (topic: string, message: Buffer) => {
        console.log("Received message:", topic, message.toString());
        setReceivedMessage(message.toString());
      });

      // エラー
      mqttClient.on("error", (err: Error) => {
        console.log("MQTT error:", err);
        mqttClient.end();
      });
    };

    connectToMqtt();

    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (client) {
      // パブリッシュ
      client.publish(MQTT_TOPIC, message);
      console.log("Message sent:", message);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix (SPA Mode)</h1>
      <h2>MQTT over WebSocket Example</h2>
      <p>Connected: {isConnected ? "Yes" : "No"}</p>
      <input
        type="text"
        value={message}
        onChangeCapture={(event) => setMessage(event.currentTarget.value)}
      />
      <button onClick={handleSendMessage}>Send Message</button>
      <p>Received Message: {receivedMessage}</p>
    </div>
  );
}
