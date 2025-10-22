import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      parent.postMessage({ iframeHeight: height }, "*");
    };

    window.addEventListener("load", sendHeight);
    window.addEventListener("resize", sendHeight);

    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("load", sendHeight);
      window.removeEventListener("resize", sendHeight);
      observer.disconnect();
    };
  }, []);

  return <Component {...pageProps} />;
}
