import type { Socket } from "socket.io";
import type { Queue } from "./utils";
import { getDiscordUserData } from "./utils";
import { getDiscordId, log } from "./utils";

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
    const discordUserData = await getDiscordUserData(socket);
    const peerDiscordUserData = await getDiscordUserData(peer);
    peer.emit("chat-start", discordUserData);
    return socket.emit("chat-start", peerDiscordUserData);
  }
  queue.lobbies[locale].push(socket);
  queue.members[discordId] = {
    position: queue.lobbies[locale].length - 1,
    lobby: locale,
  };
  console.log(discordId + " was pushed to queue\n");
  log(queue.lobbies[locale]);
  return socket.emit("join-room", { message: "waiting for peer" });
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
