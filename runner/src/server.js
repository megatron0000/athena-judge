import Express from "express"
import Cors from "cors"
import SocketIOClient from "socket.io-client"
import ChildProcess from "child_process"
import Path from "path"
import { setPortFree, startContainer, killedByOOM } from './containers'

const PORT = 3001

const app = Express()

app.use(Cors())

app.use(Express.json())
app.use(Express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.json({ data: "OK" })
})

/* function exec(command, options = {}) {
  return new Promise((resolve, reject) => {
    ChildProcess.exec(command, options, (err, stdout, stderr) => {
      if (err) return reject(err)
      resolve({ stdout, stderr })
    })
  })
}

function writeSource(socket, source) {
  return new Promise((resolve, reject) => {
    socket.emit("writeFile", { filename: "/app/program.cpp", contents: source }, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function compile(socket) {
  return new Promise((resolve, reject) => {
    socket.emit("exec", { command: "g++", args: ["/app/program.cpp", "-o", "/app/program.o"] }, (data) => {
      let { execId } = data
      let output = []
      socket.on(execId, (data2) => {
        let { event, data } = data2
        output.push(data2)
        if (event === "exit") {
          if (data === 0) {
            resolve(output)
          } else {
            reject(output)
          }
          socket.off(execId)
        }
      })
    })
  })
}

function execute(socket, input) {
  return new Promise((resolve, reject) => {
    socket.emit("exec", { command: "/app/program.o", args: [], input: input, timeoutMs: 10000 }, (data) => {
      let { execId } = data
      let output = []
      socket.on(execId, (data2) => {
        let { event, data } = data2
        output.push(data2)
        if (event === "exit") {
          if (data === 0) {
            resolve(output)
          } else {
            reject(output)
          }
          socket.off(execId)
        }
      })
    })
  })
}
*/

async function downloadSourceAndTests(socket, courseId, courseWorkId, submissionId) {
  return new Promise((resolve, reject) => {
    socket.emit('downloadSourceAndTests', { courseId, courseWorkId, submissionId }, status => resolve(status))
  })
}

async function compileSource(socket) {
  return new Promise((resolve, reject) => {
    socket.emit('compileSource', status => resolve(status))
  })
}


async function runTests(socket, executionTimeout, memLimitMB, containerId) {
  return new Promise((resolve, reject) => {
    const testResults = []

    async function endExecution(executionStatus) {
      let status
      if (await killedByOOM(containerId)) {
        status = {
          ok: false,
          message: 'Memory limit exceeded'
        }
      } else {
        status = executionStatus
      }

      resolve({ status, testResults })
    }

    socket.on('testResult', result => testResults.push(result))
    socket.on('executionEnd', () => endExecution({ ok: true, message: 'All tests run' }))
    socket.on('error', () => endExecution({ ok: false, message: 'Internal Socket error' }))

    socket.emit('runTests', { executionTimeout, memLimitMB })
  })
}



app.post("/run", async (req, res) => {
  console.log('/run activated')
  const { courseId, courseWorkId, submissionId, executionTimeout, memLimitMB } = req.body
  let { port, containerId } = await startContainer()
  console.log('port: ', port)
  console.log('containerId: ', containerId)
  let socket = SocketIOClient(`http://localhost:${port}`)
  socket.on("connect", async () => {
    console.log('docker connected')
    /* let error = null
    let data = null
    try {
      error = "WriteError"
      await writeSource(socket, source)
      error = "CompileError"
      await compile(socket)
      error = "RuntimeError"
      data = await execute(socket, input)
      error = null
    } catch (outputs) {
      console.log("error:", outputs)
      data = outputs
      if (await killedByOOM(containerId)) {
        error = 'OutOfMemoryError'
      } else if (outputs[outputs.length - 2].data === 'Time Limit Exceeded') {
        error = 'TimeLimitError'
      }
    } */
    let testResults = []
    let status = await downloadSourceAndTests(socket, courseId, courseWorkId, submissionId)

    console.log('downloaded files')

    if (status.ok) {
      status = await compileSource(socket)
    }

    console.log('compiled source')

    if (status.ok) {
      const result = await runTests(socket, executionTimeout, memLimitMB, containerId)
      testResults = result.testResults
      status = result.status
      console.log('status: ')
    }

    console.log('ran tests')

    socket.emit('stopContainer')
    socket.close()
    setPortFree(port)
    res.json({ testResults, status })

  })
})

app.listen(PORT, () => {
  console.log(`Service running on http://localhost:${PORT}`)
})