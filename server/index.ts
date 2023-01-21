import path from "path";
import { createServer } from "http";
import fs from "fs";
import express from "express";
import { Server } from "socket.io";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import { prisma } from "~/db.server";
import type { Queue } from "./utils";
import { sendMessage } from "./utils";
import { findPeer, removePeer } from "./utils";

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "server/build");

if (!fs.existsSync(BUILD_DIR)) {
  console.warn(
    "Build directory doesn't exist, please run `npm run dev` or `npm run build` before starting the server."
  );
}

const app = express();

// You need to create the HTTP server from the Express app
const httpServer = createServer(app);

// And then attach the socket.io server to the HTTP server
const io = new Server(httpServer);

// Create a queue for each locale
prisma.locale.findMany().then((locales) => {
  const queue = locales.reduce(
    (acc, { discordId }) => {
      acc.lobbies[discordId] = [];
      return acc;
    },
    { members: {}, lobbies: {}, rooms: {} } as Queue
  );

  // Then you can use `io` to listen the `connection` event and get a socket
  // from a client
  io.on("connection", (socket) => {
    // from this point you are on the WS connection with a specific client
    console.log(socket.id, "connected");

    socket.emit("confirmation", "connected!");

    socket.on("join-room", async ({ locale }) => {
      findPeer(queue, socket, locale);
    });

    socket.on("disconnect", () => {
      console.log(socket.id, "disconnected");
      removePeer(queue, socket);
    });

    socket.on("close", () => {
      console.log(socket.id, "closed");
      removePeer(queue, socket);
    });

    socket.on("send message", async (message: string, callback) => {
      sendMessage(queue, socket, message, callback);
    });

    // Check if the user is in a room
    socket.on("check room", (callback) => {
      const rooms = Array.from(socket.rooms);
      if (rooms.length < 2) {
        callback(false);
      } else {
        callback(queue.rooms[rooms[1]].messages);
      }
    });
  });
});

app.use(compression());

// You may want to be more aggressive with this caching
app.use(express.static("public", { maxAge: "1h" }));

// Remix fingerprints its assets so we can cache forever
app.use(express.static("public/build", { immutable: true, maxAge: "1y" }));

app.use(morgan("tiny"));
app.all(
  "*",
  MODE === "production"
    ? createRequestHandler({ build: require("./server/build") })
    : (req, res, next) => {
        purgeRequireCache();
        const build = require("./server/build");
        return createRequestHandler({ build, mode: MODE })(req, res, next);
      }
);

const port = process.env.PORT || 3000;

// instead of running listen on the Express app, do it on the HTTP server
httpServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

////////////////////////////////////////////////////////////////////////////////
function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
