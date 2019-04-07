import Express from "express";
import Cors from "cors";
import SocketIOClient from "socket.io-client";
import ChildProcess from "child_process";
import Path from "path";
import { setPortFree, startContainer, killedByOOM } from './containers';

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
      let output = [];
      socket.on(execId, (data2) => {
        let { event, data } = data2;
        output.push(data2);
        if (event === "exit") {
          if (data === 0) {
            resolve(output);
          } else {
            reject(output);
          }
          socket.off(execId);
        }
      });
    });
  });
}

function execute(socket, input) {
  return new Promise((resolve, reject) => {
    socket.emit("exec", { command: "/app/program.o", args: [], input: input, timeoutMs: 10000 }, (data) => {
      let { execId } = data;
      let output = [];
      socket.on(execId, (data2) => {
        let { event, data } = data2;
        output.push(data2);
        if (event === "exit") {
          if (data === 0) {
            resolve(output);
          } else {
            reject(output);
          }
          socket.off(execId);
        }
      });
    });
  });
}



app.post("/run", async (req, res) => {
  let source = req.body.source;
  let input = req.body.input;
  let { port, containerId } = await startContainer();
  let socket = SocketIOClient(`http://localhost:${port}`);
  socket.on("connect", async () => {  
    let error = null;
    let data = null;
    try {
      error = "WriteError";
      await writeSource(socket, source);
      error = "CompileError";
      await compile(socket);
      error = "RuntimeError";
      data = await execute(socket, input);
      error = null;
    } catch (outputs) {
      console.log("error:", outputs);
      data = outputs;
      if (await killedByOOM(containerId)) {
        error = 'OutOfMemoryError';
      } else if (outputs[outputs.length - 2].data === 'Time Limit Exceeded') {
        error = 'TimeLimitError';
      }
    }
    socket.emit("exit");
    socket.close();
    setPortFree(port);
    res.json({ data, error });
  });
});

app.listen(PORT, () => {
  console.log(`Service running on http://localhost:${PORT}`)
})