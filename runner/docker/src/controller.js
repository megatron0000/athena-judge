const SocketIO = require("socket.io");
const FS = require("fs");
const Path = require("path");
const ChildProcess = require("child_process");

const PORT = 3002;

const server = SocketIO(3002, { serveClient: false });

function randomString() {
  return Math.random().toString(36).substring(2, 15);
}

server.on("connection", (socket) => {
  // client socket connected
  console.log("client socket connected: " + socket.id);

  socket.on("disconnect", () => {
    // client socket disconnected
    console.log("client socket disconnected: " + socket.id);
  });

  socket.on("writeFile", (data, callback) => {
    // writes a text file relative to the path of the script
    let { filename, contents } = data;
    FS.writeFile(Path.resolve(__dirname, filename), contents, "utf8", (err) => {
      callback(err);
    });
  });

  socket.on("exec", (data, callback) => {
    // executes a command and streams back stdout, stderr and exit code
    let { command, args, input, timeoutMs } = data;
    let finished = false;
    let child = ChildProcess.spawn(command, args || [], { cwd: __dirname });

    // feed input to stdio if provided
    if (input != null) {
      child.stdin.write(input);
    }

    // generates a unique execution identifier so that data can be streamed back
    let execId = randomString();

    // informs the execution identifier to the client 
    callback({ execId: execId });

    // binds listeners
    child.stdout.on("data", (data) => {
      socket.emit(execId, { event: "stdout", data: data.toString() });
    })
    child.stderr.on("data", (data) => {
      socket.emit(execId, { event: "stderr", data: data.toString() });
    })
    child.on("exit", (code) => {
      finished = true;
      socket.emit(execId, { event: "exit", data: code });
    });

    if (timeoutMs) {
      setTimeout(() => {
        if (!finished) {
          socket.emit(execId, { event: "stderr", data: "Time Limit Exceeded" });
          child.kill("SIGKILL");
        }
      }, timeoutMs);
    }
  });

  socket.on("exit", () => {
    server.close();
    process.exit(0);
  });

});