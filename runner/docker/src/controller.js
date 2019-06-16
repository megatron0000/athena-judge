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

    ChildProcess.exec(
      `
      (set -e ;
      set -x ;
      INCLUDES=$(find . -type d | sed 's/\\(.*\\)$/-I\\1/') ;
      SOURCE_FILES=$(find . -type f -name "*.cpp" | sed 's/\\(.*\\)$/-c \\1/') ;
      g++ $INCLUDES $SOURCE_FILES 2>&1 ;
      O_FILES=$(find . -type f -name "*.o") ;
      g++ $O_FILES 2>&1 ;) 2>&1 ;
      exit $? ;
    `, {
        cwd: ctx.localSrcDir
      }, (err, stdout) => {
        if (err) {
          ctx.status = {
            ok: false,
            message: 'Compilation Error',
            additionalInfo: stdout
          }
        } else {
          ctx.status = {
            ok: true,
            message: 'Compiled source',
            additionalInfo: stdout
          }
        }

        return callback(ctx.status)
      }
    )

  })

  client.on('runTests', async parameters => {
    const { executionTimeout, memLimitMB } = parameters
    const testCount = (await FS.readdir(ctx.localTestDir)).length

    for (let i = 0; i < testCount; i++) {
      const inputPath = Path.join(ctx.localTestDir, i.toString(), 'input')
      const outputPath = Path.join(ctx.localTestDir, i.toString(), 'output')
      const metadataPath = Path.join(ctx.localTestDir, i.toString(), 'metadata')

      const [input, expectedOutput, metadata] = await Promise.all([
        FS.readFile(inputPath, 'utf8'),
        FS.readFile(outputPath, 'utf8'),
        FS.readFile(metadataPath, 'utf8').then(JSON.parse)
      ])

      const binPath = Path.join(ctx.localSrcDir, 'a.out')

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
              pass: !err && stdout === expectedOutput,
              isPrivate: metadata.isPrivate,
              weight: metadata.weight
            }
            client.emit('testResult', testResult)
            resolve()

          }
        )
      })
    }

    client.emit('executionEnd')

  })

  client.on('stopContainer', () => {
    server.close()
    process.exit(0)
  })


})