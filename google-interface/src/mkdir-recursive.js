/**
 * @type {{dirname: string, resolve: (value:any)=>any, reject: (value:any)=>any}[]}
 */
const waitQueue = []

/**
 * The original function has race-condition problems, hence the queue
 * @param {string} dirname
 * @returns {Promise<void>}
 */
function mkdirRecursive(dirname) {
  return new Promise(async (resolve, reject) => {

    waitQueue.push({ dirname, resolve, reject })

    // because only the first deals with them all
    if (waitQueue.length > 1) {
      return
    }

    function _mkdirRecursive(_dirname) {
      return new Promise((res, rej) => {
        //@ts-ignore
        require('mkdir-recursive').mkdir(_dirname, err => {
          if (err && !err.message.match('EEXIST')) {
            return rej(err)
          }
          return res()
        })
      })
    }

    while (waitQueue.length) {
      const item = waitQueue[0]
      await _mkdirRecursive(item.dirname).then(item.resolve).catch(item.reject)
      waitQueue.shift()
    }
  })
}

module.exports = {
  mkdirRecursive
}