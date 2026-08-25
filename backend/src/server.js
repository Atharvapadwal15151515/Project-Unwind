import dotenv from "dotenv";
import http from "http";

dotenv.config();

import app from "./app.js";
import pool from "./config/database.js";
import initializeSocket from "./config/socket.js";

import {
  startNotificationScheduler,
  stopNotificationScheduler
} from "./services/notification/notificationScheduler.service.js";

const PORT =
  Number(
    process.env.PORT
  ) || 5000;

let httpServer;
let io;

async function startServer() {
  try {
    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    */

    await pool.query(
      "SELECT 1"
    );

    console.log(
      "Neon PostgreSQL connected successfully"
    );

    /*
    |--------------------------------------------------------------------------
    | HTTP + Socket.IO
    |--------------------------------------------------------------------------
    */

    httpServer =
      http.createServer(
        app
      );

    io =
      initializeSocket(
        httpServer
      );

    /*
    |--------------------------------------------------------------------------
    | Daily Tracker + Habit Notifications
    |--------------------------------------------------------------------------
    |
    | Sleep  = 09:00
    | Energy = 10:00
    | Water  = 13:00
    | Mood   = 22:00
    |
    | Habit = user's selected reminder time.
    |
    |--------------------------------------------------------------------------
    */

    startNotificationScheduler();

    /*
    |--------------------------------------------------------------------------
    | Start Server
    |--------------------------------------------------------------------------
    */

    httpServer.listen(
      PORT,
      () => {
        console.log(
          `UNWIND backend running on port ${PORT}`
        );

        console.log(
          `Environment: ${
            process.env.NODE_ENV ||
            "development"
          }`
        );
      }
    );

    httpServer.on(
      "error",
      error => {
        if (
          error.syscall !==
          "listen"
        ) {
          throw error;
        }

        if (
          error.code ===
          "EADDRINUSE"
        ) {
          console.error(
            `Port ${PORT} is already in use`
          );
        } else if (
          error.code ===
          "EACCES"
        ) {
          console.error(
            `Port ${PORT} requires elevated permission`
          );
        } else {
          console.error(
            "HTTP server error:",
            error
          );
        }

        process.exit(1);
      }
    );
  } catch (error) {
    console.error(
      "Failed to start UNWIND backend:",
      error.message
    );

    try {
      await pool.end();
    } catch (
      databaseError
    ) {
      console.error(
        "Failed to close PostgreSQL pool:",
        databaseError.message
      );
    }

    process.exit(1);
  }
}

async function shutdownServer(
  signal
) {
  console.log(
    `\n${signal} received. Shutting down UNWIND backend...`
  );

  try {
    /*
    |--------------------------------------------------------------------------
    | Stop notification scheduler
    |--------------------------------------------------------------------------
    */

    stopNotificationScheduler();

    /*
    |--------------------------------------------------------------------------
    | Socket.IO
    |--------------------------------------------------------------------------
    */

    if (io) {
      await new Promise(
        resolve => {
          io.close(
            () => {
              console.log(
                "Socket.IO server closed"
              );

              resolve();
            }
          );
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | HTTP
    |--------------------------------------------------------------------------
    */

    if (
      httpServer?.listening
    ) {
      await new Promise(
        (
          resolve,
          reject
        ) => {
          httpServer.close(
            error => {
              if (error) {
                reject(
                  error
                );

                return;
              }

              console.log(
                "HTTP server closed"
              );

              resolve();
            }
          );
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    */

    await pool.end();

    console.log(
      "PostgreSQL connection pool closed"
    );

    console.log(
      "UNWIND backend shut down successfully"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Error while shutting down UNWIND backend:",
      error.message
    );

    process.exit(1);
  }
}

process.on(
  "SIGINT",
  () => {
    shutdownServer(
      "SIGINT"
    );
  }
);

process.on(
  "SIGTERM",
  () => {
    shutdownServer(
      "SIGTERM"
    );
  }
);

process.on(
  "unhandledRejection",
  reason => {
    console.error(
      "Unhandled promise rejection:",
      reason
    );

    /*
     * Log the error but do NOT kill the entire backend.
     *
     * Individual services/schedulers already handle their own failures.
     */
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "Uncaught exception:",
      error
    );

    shutdownServer(
      "UNCAUGHT_EXCEPTION"
    );
  }
);

startServer();