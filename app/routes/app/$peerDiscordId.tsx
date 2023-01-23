import type { Locale, User } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "~/context";
import type { DiscordUserData, Message } from "~/types";
import { useMatchesData } from "~/utils";
import { useLocation, useNavigate } from "@remix-run/react";
import Button from "~/components/atoms/Button";
import Avatar from "~/components/atoms/Avatar";
import Link from "~/components/atoms/Link";

export default function AppRoomPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const peerDiscordUserData: DiscordUserData | undefined = location?.state;

  const {
    userData: { id: userId },
  } = useMatchesData("routes/app") as {
    discordUserData: DiscordUserData;
    userData: User;
    locale: Locale;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("send-message", (messages: Message[]) => {
      setMessages(messages);
    });
  }, [navigate, socket]);

  const sendMessage = () => {
    if (!inputRef.current?.value) return;
    socket?.emit("send-message", inputRef.current?.value, () => {
      setPendingMessages((pendingMessages) => pendingMessages.slice(1));
    });
    setPendingMessages([
      ...pendingMessages,
      { userId, message: inputRef.current!.value, pending: true },
    ]);
    inputRef.current!.value = "";
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  // if (!peerDiscordUserData) {
  //   return (
  //     <section className="flex h-full items-center justify-center p-6 text-lg text-white md:p-12">
  //       <p>Invalid room</p>
  //     </section>
  //   );
  // }

  return (
    <section className="flex h-full items-center justify-center p-6 md:p-12">
      <div className="container flex h-full w-full flex-col rounded-xl bg-slate-600">
        <div className="flex justify-between border-b border-slate-400 p-3">
          <div className="flex items-center gap-3 text-white">
            <Avatar discordUserData={peerDiscordUserData} size="sm" />
            {peerDiscordUserData?.username || "Unknown user"}
          </div>
          <Link to="/app" className="self-center">
            Leave Chat
          </Link>
        </div>
        <div className="flex h-full w-full flex-col p-3">
          <div className="flex h-0 grow flex-col justify-end overflow-y-auto">
            {[...messages, ...pendingMessages].map((message) => (
              <div
                key={message.userId + ":" + message.message}
                className={`${
                  message.userId === userId
                    ? "self-end bg-blue-500/40"
                    : "self-start bg-red-500/40"
                } mb-3 rounded-lg p-3 ${
                  message.pending ? "animate-pulse text-gray-300" : "text-white"
                }`}
              >
                <p>{message.message}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              className="h-12 flex-1 rounded-lg py-6 px-3"
              onKeyDown={handleKeyDown}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
