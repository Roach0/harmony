import type { Socket } from "socket.io";
import type { Queue } from "./utils";
import { getUserId } from "./utils";

export const sendMessage = async (
  queue: Queue,
  socket: Socket,
  message: string,
  callback: () => void
) => {
  const rooms = Array.from(socket.rooms);
  if (rooms.length < 2) {
    return;
  }
  const userId = await getUserId(socket);
  queue.rooms[rooms[1]].messages.push({ userId, message });
  socket.to(rooms[1]).emit("send-message", queue.rooms[rooms[1]].messages);
  callback();
  socket.emit("send-message", queue.rooms[rooms[1]].messages);
};
