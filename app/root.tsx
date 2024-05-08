import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import AuthContextProvider from "./auth";

// ここにブラウザでしか使えないAPI（windowなど）にアクセスしようとするとエラーになる
export function Layout({ children }: { children: React.ReactNode }) {
  // サーバーサイドでも表示されるし、ブラウザのコンソールでも表示される
  console.log("Layout()");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  console.log("App()");
  return (
    <AuthContextProvider>
      <Outlet />
    </AuthContextProvider>
  );
}

// ここがエントリーポイント？
// SPAモードではroot.tsxでしか使えない
export function HydrateFallback() {
  return <p>Loading...</p>;
}
