import Express from "express"
import Cors from "cors"
import SocketIOClient from "socket.io-client"
import { setPortFree, startContainer, killedByOOM } from './containers'
import { exec } from 'child_process'

const PORT = 3001

const app = Express()

app.use(Cors())

app.use(Express.json())
app.use(Express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.json({ data: "OK" })
})

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
  const { port, containerId } = await startContainer()

  console.log('port: ', port)
  console.log('containerId: ', containerId)

  let socket = SocketIOClient(`http://localhost:${port}`)
  socket.on("connect", async () => {
    console.log('docker connected')
    let testResults = []
    let status = await downloadSourceAndTests(socket, courseId, courseWorkId, submissionId)

    console.log('downloaded files')

    if (status.ok) {
      status = await compileSource(socket)
      console.log('compiled source')
    }

    if (status.ok) {
      const result = await runTests(socket, executionTimeout, memLimitMB, containerId)
      testResults = result.testResults
      status = result.status
      console.log('ran tests')
    }

    console.log('status: ', status)

    socket.emit('stopContainer')
    socket.close()
    setPortFree(port)
    res.json({ testResults, status })

  })
})

/**
 * Cleanup docker containers and exit
 * 
 * TODO: Test if "docker stop" properly works
 */
app.post('/exit', (req, res) => {
  res.status(200).end()
  exec('docker stop $(docker ps -q)', () => process.exit(0))
})

app.listen(PORT, () => {
  console.log(`Service running on http://localhost:${PORT}`)
})