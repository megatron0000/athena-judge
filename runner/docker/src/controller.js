const SocketIO = require("socket.io");
const FS = require("fs");
const Path = require("path");
const ChildProcess = require("child_process");
const { cloudstorage } = require('./google-interface')

const PORT = 3002;

const server = SocketIO(3002, { serveClient: false });

function randomString() {
  return Math.random().toString(36).substring(2, 15);
}

/* server.on("connection", (socket) => {
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

    // else error in stdin leads the node process to throw 
    // (unhandled error), destroying the container
    child.stdin.on('error', err => {
        console.log('child stdin error: ')
        console.log(err)
    })

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

}); */

server.on('connection', client => {
  const ctx = {}

  client.on('downloadSourceAndTests', async (courseId, courseWorkId, submissionId, callback) => {
    ctx.courseId = courseId
    ctx.courseWorkId = courseWorkId
    ctx.submissionId = submissionId
    ctx.status = { ok: true, message: 'Waiting command' }
    ctx.localSrcDir = Path.join('/tmp', submissionId, 'src')
    ctx.localTestDir = Path.join('/tmp', submissionId, 'test')

    try {
      await Promise.all([
        cloudstorage.downloadCourseWorkTestFiles(
          ctx.courseId,
          ctx.courseWorkId,
          ctx.submissionId,
          ctx.localTestDir
        ),
        cloudstorage.downloadCourseWorkSubmissionFiles(
          ctx.courseId,
          ctx.courseWorkId,
          ctx.submissionId,
          ctx.localSrcDir
        )
      ])

      ctx.status = {
        ok: true,
        message: 'Downloaded source and test files'
      }

    } catch (err) {
      ctx.status = {
        ok: false,
        message: 'Error downloading files: ' + err.message
      }
    }

    return callback(ctx.status)

  })

  client.on('compileSource', callback => {
    /**
     * @type {string[]}
     */
    const sourceList = FS.readdirSync(ctx.localSrcDir)
    const mainFile = sourceList.find(source => source === 'main.cpp')

    if (!mainFile) {
      ctx.status = {
        ok: false,
        message: 'File main.cpp not present at root directory'
      }
      return callback(ctx.status)
    }

    ChildProcess.exec(`g++ ${ctx.localSrcDir}/main.cpp -o ${ctx.localSrcDir}/main.o`, (err, stdout, stderr) => {
      if (err) {
        ctx.status = {
          ok: false,
          message: 'Compilation Error: ' + stderr
        }
      } else {
        ctx.status = {
          ok: true,
          message: 'Compiled source'
        }
      }

      return callback(status)
    })

  })

  client.on('runTests', async () => {
    const testCount = FS.readdirSync(ctx.localTestDir).length

    for (let i = 0; i < testCount; i++) {
      const inputPath = Path.join(ctx.localTestDir, i.toString(), 'input')
      const outputPath = Path.join(ctx.localTestDir, i.toString(), 'output')
      const binPath = Path.join(ctx.localSrcDir, 'main.o')
      await new Promise(resolve => {
        ChildProcess.exec(`${binPath} << ${inputPath}`, (err, stdout, stderr) => {
          const testResult = {
            input: FS.readFileSync(inputPath),
            expectedOutput: FS.readFileSync(outputPath),
            output: stdout,
            error: stderr,
            pass: err ? false : true
          }

          client.emit('testResult', testResult)
          resolve()

        })
      })
    }

    client.emit('executionEnd')

  })

  client.on('stopContainer', () => {
    server.close()
    process.exit(0)
  })


})