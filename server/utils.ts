import type { Socket } from "socket.io";
import {
  DISCORD_SESSION_KEY,
  getSessionFromSocket,
  USER_SESSION_KEY,
} from "~/session.server";
import type { Message } from "~/types";

export interface Queue {
  members: {
    [key: string]: {
      lobby: string;
      position: number;
      room?: string;
      peer?: Socket;
    };
  };
  lobbies: { [key: string]: Socket[] };
  rooms: {
    [key: string]: {
      memberIds: string[];
      messages: Message[];
    };
  };
}

export const getDiscordId = async (socket: Socket) => {
  const session = await getSessionFromSocket(socket);
  const discordId: string = session.get(DISCORD_SESSION_KEY);
  if (!discordId) {
    socket.emit("join-room", { error: "user not found" });
  }
  return discordId;
};

export const getUserId = async (socket: Socket) => {
  const session = await getSessionFromSocket(socket);
  const userId: string = session.get(USER_SESSION_KEY);
  if (!userId) {
    socket.emit("join-room", { error: "user not found" });
  }
  return userId;
};

export const log = (arr: string | any[]) => {
  console.log("Queue: ");
  for (let i = arr.length; i--; ) {
    console.log(arr[i].id);
  }
  console.log("\n");
};

export const findPeer = async (
  queue: Queue,
  socket: Socket,
  locale: string
) => {
  if (!queue.lobbies[locale]) {
    socket.emit("join-room", { error: "locale not found" });
  }
  const discordId = await getDiscordId(socket);
  // if (queue.members[discordId]) {
  //   console.log("Already in queue\n");
  //   return socket.emit("join-room", { error: "already in queue" });
  // }
  if (queue.lobbies[locale].length > 0) {
    const peer = queue.lobbies[locale].pop();
    if (!peer) {
      console.log("No peer found\n");
      return socket.emit("join-room", { error: "peer not found" });
    }
    console.log(peer.id + " was popped from queue\n");
    log(queue.lobbies[locale]);
    const peerDiscordId = await getDiscordId(peer);
    const room = discordId + "#" + peerDiscordId;
    peer.join(room);
    socket.join(room);
    queue.members[discordId] = {
      position: 0,
      lobby: locale,
      room,
      peer,
    };
    queue.members[peerDiscordId] = {
      position: 0,
      lobby: locale,
      room,
      peer: socket,
    };
    queue.rooms[room] = {
      memberIds: [discordId, peerDiscordId],
      messages: [],
    };
    console.log(discordId + " and " + peerDiscordId + " joined room " + room);
    peer.emit("chat start", { name: socket.id, room: room });
    return socket.emit("chat start", { peerDiscordId, room: room });
  } else {
    queue.lobbies[locale].push(socket);
    queue.members[discordId] = {
      position: queue.lobbies[locale].length - 1,
      lobby: locale,
    };
    console.log(socket.id + " was pushed to queue\n");
    log(queue.lobbies[locale]);
    return socket.emit("join-room", { message: "waiting for peer" });
  }
};

export const removePeer = async (queue: Queue, socket: Socket) => {
  const discordId = await getDiscordId(socket);
  if (!queue.members[discordId]) {
    return socket.emit("join-room", { error: "not in queue" });
  }
  const { position, lobby } = queue.members[discordId];
  queue.lobbies[lobby].splice(position, 1);
  delete queue.members[discordId];
  console.log(socket.id + " was removed from queue\n");
  log(queue.lobbies[lobby]);
};

export const getPeer = async (queue: Queue, socket: Socket) => {
  const discordId = await getDiscordId(socket);
  if (!queue.members[discordId]) {
    socket.emit("join-room", { error: "not in room" });
  }

  if (!queue.members[discordId].peer) {
    socket.emit("join-room", { error: "peer not found" });
  }

  if (queue.members[discordId].peer) {
    return queue.members[discordId].peer;
  }
};

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
  socket.to(rooms[1]).emit("send message", queue.rooms[rooms[1]].messages);
  callback();
  socket.emit("send message", queue.rooms[rooms[1]].messages);
};
