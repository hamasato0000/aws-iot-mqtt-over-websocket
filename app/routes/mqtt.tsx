import { useAuth0 } from "@auth0/auth0-react";
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

const MQTT_BROKER_URL = `wss://${
  import.meta.env.VITE_AWS_IOT_ENDPOINT // 環境変数にアクセス
}:443/mqtt`;
const MQTT_TOPIC = "test/topic";
const AWS_IOT_CUSTOM_AUTHORIZER_NAME = import.meta.env
  .VITE_AWS_IOT_CUSTOM_AUTHORIZER_NAME;

export default function Mqtt() {
  const { getAccessTokenSilently } = useAuth0();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const mqttClientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const connectMqttOverWebSocket = async () => {
      try {
        // アクセストークンの取得
        const token = await getAccessTokenSilently();
        const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

        // MQTTクライアント
        const mqttClient = mqtt.connect(
          `${MQTT_BROKER_URL}?x-amz-customauthorizer-name=${AWS_IOT_CUSTOM_AUTHORIZER_NAME}`, // クエリパラメータでカスタムオーソライザーを指定する必要がある
          {
            clientId: clientId,
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            rejectUnauthorized: true,
            username: "test",
            password: token, // base64エンコードする必要がある
          }
        );
        mqttClientRef.current = mqttClient;

        // ブローカーに接続
        // NOTE: 接続に関するエラーハンドリングは？
        mqttClientRef.current.on("connect", () => {
          setIsConnected(true);
          console.log("Connected to MQTT broker. Client ID:", clientId);

          // サブスクライブ
          mqttClientRef.current?.subscribe(MQTT_TOPIC, (err) => {
            if (err) {
              console.error("Failed to subscribe:", err);
            } else {
              console.log("Subscribed to topic:", MQTT_TOPIC);
            }
          });
        });

        // メッセージ受信時のイベント
        mqttClientRef.current.on(
          "message",
          (topic: string, message: Buffer) => {
            console.log("Received message:", topic, message.toString());
            // 直接 receivedMessage を参照すると useEffect で警告が出る
            setReceivedMessages((prevMessages) => [
              ...prevMessages,
              message.toString(),
            ]);
          }
        );

        // エラー時のイベント
        mqttClientRef.current.on("error", (err: Error) => {
          setIsConnected(true);
          console.log("MQTT error:", err);
          mqttClientRef.current?.end();
        });

        // DISCONNECTを送信したときのイベント
        mqttClientRef.current.on("close", () => {
          setIsConnected(false);
          console.log("Emitted DISCONNECT.");
        });

        // ブローカーからDISCONNECTを受信
        mqttClientRef.current.on("disconnect", () => {
          setIsConnected(false);
          console.log("MQTT Broker emitted DISCONNECT.");
        });

        // クライアントクローズ時のイベント
        // end()が呼び出されると発行される
        // end()にコールバック関数がセットされているときは
        // そのコールバック関数が返されると発行される
        mqttClientRef.current.on("end", () => {
          setIsConnected(false);
          console.log("Close MQTT Client.");
        });
      } catch (err) {
        console.log("Failed to get access token: ", err);
      }
    };

    connectMqttOverWebSocket();

    // アンマウント時の動作
    return () => {
      // クライントをクローズ
      if (mqttClientRef.current) {
        mqttClientRef.current.end(() => {
          console.log("MQTT connection closed.");
        });
      }
    };
  }, [getAccessTokenSilently]);

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
      <div>
        {/* index を使うのは非推奨らしい */}
        {receivedMessages.map((message, index) => (
          <div key={index}>
            <p>{message}</p>
          </div>
        ))}
      </div>
      <NavLink to="/">TOP</NavLink>
    </div>
  );
}
