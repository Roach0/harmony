import { useSearchParams } from "@remix-run/react";
import * as React from "react";

interface DiscordAuthOptions {
  clientId: string;
  clientSecret: string;
}

export default function useDiscordAuth({
  clientId,
  clientSecret,
}: DiscordAuthOptions) {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  React.useEffect(() => {
    if (code) {
      fetch("?index", {
        body: JSON.stringify({ clientId, clientSecret, code }),
      });
    }
  }, [clientId, clientSecret, code]);
}
