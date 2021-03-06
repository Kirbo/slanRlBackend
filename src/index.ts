import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response, Router } from "express";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const port = 4000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const client_id = IS_PRODUCTION
  ? "29d912f29a2274f9cb81"
  : "93b9deac9ac0b91c370a";
const client_secret = process.env.CLIENT_SECRET;

const app = express();
const server = createServer(app);
const io = new Server(server);

const router: Router = express.Router();

app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }),
);
app.use(express.json({ limit: "50mb", extended: true, parameterLimit: 50000 }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use("/api", router);

router
  .post("/access_token", (req: Request, res: Response) => {
    const data = {
      client_id,
      client_secret,
      code: req.body.code,
    };

    const options = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    };

    axios
      .post("https://github.com/login/oauth/access_token", data, options)
      .then(response => {
        res.send(response.data);
      });
  })
  .get("/file", (req: Request, res: Response) => {
    const options = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        Authorization: `${req.headers.authorization}`,
      },
    };

    axios.get(`${req.query.file}`, options).then(response => {
      res.send(response.data);
    });
  })
  .get("/gists", (req: Request, res: Response) => {
    const options = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        Authorization: `${req.headers.authorization}`,
      },
    };

    axios.get(`https://api.github.com/gists`, options).then(response => {
      res.send(response.data);
    });
  })
  .post("/gists", (req: Request, res: Response) => {
    const options = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        Authorization: `${req.headers.authorization}`,
      },
    };

    axios
      .post(`https://api.github.com/gists`, req.body, options)
      .then(response => {
        res.send(response.data);
      });
  })
  .patch("/gists/:gistId", (req: Request, res: Response) => {
    const options = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        Authorization: `${req.headers.authorization}`,
      },
    };

    axios
      .patch(
        `https://api.github.com/gists/${req.params.gistId}`,
        req.body,
        options,
      )
      .then(response => {
        res.send(response.data);
      });
  })
  .get("/user", (req: Request, res: Response) => {
    const options = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        Authorization: `${req.headers.authorization}`,
      },
    };

    axios.get("https://api.github.com/user", options).then(response => {
      res.send(response.data);
    });
  });

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

/* Socket stuff */

interface Score {
  playerName?: string;
  gameStatus: number;
  depth: number;
  turns: number;
}

type Scores = {
  [id: string]: Score;
};

const liveScores: Scores = {};

const topScores: Scores = {};

export enum GameStatus {
  MAINMENU,
  NEWGAME,
  STARTUP,
  IDLE,
  NEW_TURN,
  VICTORY,
  DEFEAT,
}

io.emit("status");

setInterval(() => {
  io.emit("status");
  setTimeout(async () => {
    io.emit("stats", await stats());
  });
}, 1000);

const stats = async () => ({
  live: liveScores,
  top: topScores,
  currentPlayers: [...(await io.allSockets())].length,
});

io.on("connection", async client => {
  const allClients = [...(await io.allSockets())];

  console.log(
    `Client connected with id: ${client.id}, total client count ${allClients.length}`,
  );

  client.emit("stats", await stats());

  client.on("score", (score: Score) => {
    if (
      ![GameStatus.MAINMENU, GameStatus.NEWGAME, GameStatus.DEFEAT].includes(
        score.gameStatus,
      )
    ) {
      liveScores[client.id] = score;
    }
  });
  client.on("dead", (score: Score) => {
    delete liveScores[client.id];

    if (score.playerName) {
      const playerTopScores = topScores[score.playerName];
      if (playerTopScores) {
        const { depth, turns } = playerTopScores;
        if (
          depth > score.depth ||
          (depth >= score.depth && turns <= score.turns)
        ) {
          return;
        }
      }
      topScores[score.playerName] = score;
    }
  });
  client.on("disconnect", () => {
    console.log(`Client disconnected ${client.id}`);
    delete liveScores[client.id];
  });
});
