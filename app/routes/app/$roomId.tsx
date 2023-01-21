import type { Locale } from "@prisma/client";
import type { User } from "discord-oauth2";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "~/context";
import type { DiscordUserData, Message } from "~/types";
import { useMatchesData } from "~/utils";
import { useNavigate } from "@remix-run/react";

export default function AppRoomPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const socket = useSocket();
  const navigate = useNavigate();

  const {
    userData: { id: userId },
  } = useMatchesData("routes/app") as {
    discordUserData: DiscordUserData;
    userData: User;
    locale: Locale;
  };

  useEffect(() => {
    if (!socket) return;

    socket.emit("check room", (inRoom: boolean, messages?: Message[]) => {
      if (!inRoom) navigate("/app");
      if (messages) setMessages(messages);
    });

    socket.on("send message", (messages: Message[]) => {
      setMessages(messages);
    });
  }, [navigate, socket]);

  const sendMessage = () => {
    if (!inputRef.current?.value) return;
    socket?.emit("send message", inputRef.current?.value, () => {
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

  return (
    <section className="flex h-full items-center justify-center p-6 md:p-12">
      <div className="container flex h-full w-full flex-col rounded-xl bg-slate-600">
        <div className="m-3 flex flex-1 flex-col">
          {[...messages, ...pendingMessages].map((message) => (
            <div
              key={message.userId + ":" + message.message}
              className={`${
                message.userId === userId ? "bg-blue-500/40" : "bg-red-500/40"
              } mb-3 rounded-lg p-3 ${
                message.pending ? "animate-pulse text-gray-300" : "text-white"
              }`}
            >
              <p>{message.message}</p>
            </div>
          ))}
        </div>
        <div className="m-3 flex gap-3">
          <input
            ref={inputRef}
            className="h-12 flex-1 rounded-lg py-6 px-3"
            onKeyDown={handleKeyDown}
          />
          <button
            className="flex h-12 w-16 items-center justify-center rounded-lg bg-blue-500 px-2.5 py-2 font-medium text-white hover:bg-blue-600"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
