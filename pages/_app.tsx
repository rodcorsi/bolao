import "../styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
