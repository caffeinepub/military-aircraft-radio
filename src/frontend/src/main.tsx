import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SplashLoader } from "./components/SplashLoader";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "../index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

function Root() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashLoader onDone={() => setSplashDone(true)} />}
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <App />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
