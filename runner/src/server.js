/*
@vb: At the moment, the runner is not perfectly secure and does
not deal with concurrent requests. It just works minimally.
*/

import Express from "express";
import Cors from "cors";
import SocketIOClient from "socket.io-client";
import ChildProcess from "child_process";
import Path from "path";

const PORT = 3001;

const app = Express();

app.use(Cors());

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ data: "OK" });
});

function exec(command, options = {}) {
  return new Promise((resolve, reject) => {
    ChildProcess.exec(command, options, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout, stderr });
    })
  });
}

function writeSource(socket, source) {
  return new Promise((resolve, reject) => {
    socket.emit("writeFile", { filename: "/app/program.cpp", contents: source }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function compile(socket) {
  return new Promise((resolve, reject) => {
    socket.emit("exec", { command: "g++", args: ["/app/program.cpp", "-o", "/app/program.o"] }, (data) => {
      let { execId } = data;
      socket.on(execId, (data2) => {
        let { event, data } = data2;
        console.log(data2);
        if (event === "exit") {
          if (data === 0) {
            resolve();
          } else {
            reject(data);
          }
          socket.off(execId);
        }
      });
    });
  });
}

function execute(socket) {
  return new Promise((resolve, reject) => {
    socket.emit("exec", { command: "/app/program.o", args: [], timeoutMs: 10000 }, (data) => {
      let { execId } = data;
      socket.on(execId, (data2) => {
        let { event, data } = data2;
        console.log(data2);
        if (event === "exit") {
          if (data === 0) {
            resolve();
          } else {
            reject(data);
          }
          socket.off(execId);
        }
      });
    });
  });
}

app.post("/run", async (req, res) => {
  let source = req.body.source;

  console.log("request source: " + source);

  // start docker container
  ChildProcess.exec("npm run start", { cwd: Path.resolve(__dirname, "..", "docker") }, (err, stdout, stderr) => {
    console.log("docker:", { err, stdout, stderr });
  });

  console.log("docker container running");

  let socket = SocketIOClient("http://localhost:3002");
  socket.on("connect", async () => {  
    console.log("socket connected");
    try {
      await writeSource(socket, source);
      await compile(socket);
      await execute(socket);
    } catch (err) {
      console.log("err:", err);
    }
    socket.emit("exit");
    socket.close();
    console.log("done!");
    res.json({ data: "OK" });
  });
});

app.listen(PORT, () => {
  console.log(`Service running on http://localhost:${PORT}`)
})