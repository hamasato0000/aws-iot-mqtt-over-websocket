import { MetaFunction } from "@remix-run/node";
import { NavLink } from "@remix-run/react";
import mqtt, { MqttClient } from "mqtt";
import { useEffect, useRef, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "MQTT" },
    { name: "description", content: "Try MQTT over WebSocket" },
  ];
};

const MQTT_BROKER_URL = "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = "test/topic";

export default function Mqtt() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const mqttClientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      clientId: clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });
    mqttClientRef.current = mqttClient;

    // ブローカーに接続
    // NOTE: 接続に関するエラーハンドリングは？
    mqttClientRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to MQTT broker. Client ID:", clientId);

      // サブスクライブ
      // NOTE: 前段でsetClientでclientにmqttClientセットしているし、clientで良いのでは？
      mqttClientRef.current?.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error("Failed to subscribe:", err);
        } else {
          console.log("subscribed to topic:", MQTT_TOPIC);
        }
      });
    });

    // メッセージ受信
    mqttClientRef.current.on("message", (topic: string, message: Buffer) => {
      console.log("Received message:", topic, message.toString());
      setReceivedMessage(message.toString());
    });

    // エラー
    mqttClientRef.current.on("error", (err: Error) => {
      console.log("MQTT error:", err);
      mqttClientRef.current?.end();
    });

    return () => {
      // アンマウント時はコネクションをクローズ
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (mqttClientRef.current) {
      // パブリッシュ
      mqttClientRef.current.publish(MQTT_TOPIC, message);
      console.log("Message sent:", message);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>MQTT over WebSocket Example</h1>
      <p>Connected: {isConnected ? "Yes" : "No"}</p>
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.currentTarget.value)}
      />
      <button onClick={handleSendMessage}>Send Message</button>
      <p>Received Message: {receivedMessage}</p>
      <NavLink to="/">TOP</NavLink>
    </div>
  );
}
