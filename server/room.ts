import type { Queue } from "./utils";

export const findRoom = (queue: Queue, roomId: string) => {
  return queue.rooms[roomId];
};
