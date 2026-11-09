import { useEffect, useState } from "react";
import { generateOtp, secondsRemaining } from "./totp";

export function useOtp(secret: string | null) {
  const [code, setCode] = useState("------");
  const [remaining, setRemaining] = useState(secondsRemaining());

  useEffect(() => {
    if (!secret) return;
    let lastCounter = -1;
    const tick = () => {
      const now = Date.now();
      setRemaining(secondsRemaining(now));
      const counter = Math.floor(now / 30000);
      if (counter !== lastCounter) {
        lastCounter = counter;
        void generateOtp(secret, now).then((next) => setCode(next));
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [secret]);
  return { code, remaining };
}
