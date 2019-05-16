const SocketIO = require("socket.io")
const FS = require('promise-fs')
const Path = require("path")
const ChildProcess = require("child_process")
const { cloudstorage } = require('./google-interface')

const PORT = 3002

const server = SocketIO(PORT, { serveClient: false })

function randomString() {
  return Math.random().toString(36).substring(2, 15)
}


server.on('connection', client => {
  const ctx = {}

  client.on('downloadSourceAndTests', async (parameters, callback) => {
    const { courseId, courseWorkId, submissionId } = parameters
    ctx.courseId = courseId
    ctx.courseWorkId = courseWorkId
    ctx.submissionId = submissionId
    ctx.status = { ok: true, message: 'Waiting command' }
    ctx.localSubmissionDir = Path.join('/tmp', courseId, courseWorkId, submissionId)
    ctx.localSrcDir = Path.join(ctx.localSubmissionDir, 'src')
    ctx.localTestDir = Path.join(ctx.localSubmissionDir, 'test')

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

  client.on('compileSource', async callback => {
    /**
     * @type {string[]}
     */
    const sourceList = await FS.readdir(ctx.localSrcDir)
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

      return callback(ctx.status)
    })

  })

  client.on('runTests', async parameters => {
    const { executionTimeout, memLimitMB } = parameters
    const testCount = (await FS.readdir(ctx.localTestDir)).length

    for (let i = 0; i < testCount; i++) {
      const inputPath = Path.join(ctx.localTestDir, i.toString(), 'input')
      const outputPath = Path.join(ctx.localTestDir, i.toString(), 'output')
      const binPath = Path.join(ctx.localSrcDir, 'main.o')
      const [input, expectedOutput] = await Promise.all([
        FS.readFile(inputPath, 'utf8'),
        FS.readFile(outputPath, 'utf8')
      ])

      await new Promise(resolve => {
        ChildProcess.exec(
          `ulimit -v ${memLimitMB * 1024}; ${binPath} < ${inputPath}`,
          { timeout: executionTimeout },
          (err, stdout, stderr) => {
            const testResult = {
              input,
              expectedOutput,
              output: stdout,
              // TODO: This timeout identification is not 100% reliable
              error: !err ? '' : stderr || 'Timeout',
              pass: !err && stdout === expectedOutput
            }
            client.emit('testResult', testResult)
            resolve()

          }
        )
      })
    }

    ChildProcess.exec(`rm -r -f ${ctx.localSubmissionDir}`, (err, stdout, stderr) => {
      client.emit('executionEnd')
    })

  })

  client.on('stopContainer', () => {
    server.close()
    process.exit(0)
  })


})