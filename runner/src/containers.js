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

async function getOpenPort() {
  const port = await portfinder.getPortPromise({
    port: 3000,
    stopPort: 4000
  });
  if (portsInUse[port]) {
  	return getOpenPort();
  }
  portsInUse[port] = true;
  return port;
}

/**
 * Starts container and return port.
 * May throw in case of any error
 */
export async function startContainer() {
  const port = await getOpenPort();
  let data = await child_exec(`HOSTPORT=${port} npm run start`, {
    cwd: Path.resolve(__dirname, "..", "docker")
    // timeout: 30000
  });
  return port
}

/**
 * Declare `port` as free, so it can be later
 * elligible for reuse
 */
export function setPortFree(port) {
	delete portsInUse[port];
}