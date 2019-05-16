/**
 * Utilities for starting the docker container from ../docker
 * 
 * Automatically asssigns an open port to each container started
 * (concurrency is supported)
 * 
 * BUT you must call setPortFree when you deactivate your container
 * (and deactivating containers is NOT handled by this module)
 *
 * TODO: Handle errors
 */

import Path from "path";
import util from "util";
import portfinder from "portfinder";
const child_exec = util.promisify(require('child_process')
  .exec);

/*
* key->value in which key is a port and value is 
* true (for used port) or false(ish) otherwise
*/
const portsInUse = {};

async function getOpenPort(startPort=3010, stopPort=4000) {
  const port = await portfinder.getPortPromise({
    port: startPort,
    stopPort: stopPort
  });
  if (portsInUse[port]) {
  	return getOpenPort(port + 1, stopPort);
  }
  portsInUse[port] = true;
  return port;
}

/**
 * Starts container and return port and containerId.
 * May throw in case of any error
 */
export async function startContainer() {
  const port = await getOpenPort();
  let data = await child_exec(`HOSTPORT=${port} npm run start`, {
    cwd: Path.resolve(__dirname, "..", "docker")
    // timeout: 30000
  });
  const containerId = data.stdout.split('\n').slice(-2)[0];
  return { port, containerId };
}

/*
 * Returns true if and only if container was killed by excess memory usage.
 * 
 * If container is not already stopped at call time, stops it as well.
 */
export async function killedByOOM(containerId) {
  await child_exec(`docker container stop ${containerId}`);
  const stat = await child_exec(`docker inspect --format '{{.State.OOMKilled}}' ${containerId}`);
  return stat.stdout.match('true') !== null;
}

/**
 * Declare `port` as free, so it can be later
 * elligible for reuse
 */
export function setPortFree(port) {
	delete portsInUse[port];
}