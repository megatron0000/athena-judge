import Axios from "axios";

import Config from "./Config";

export default class Api { };

Api.authorizationToken = ''

/**
 * @param {string} gid
 * @param {string} id_token
 */
Api.setAuthorizationToken = (gid, id_token) => Api.authorizationToken = gid + ':' + id_token

// https://stackoverflow.com/questions/43051291/attach-authorization-header-for-all-axios-requests
Axios.interceptors.request.use(config => {
  config.headers.Authorization = Api.authorizationToken
  return config
})

// This is a wrapper around the Axios library so we can log all Api calls and responses.

if (Config.ENABLE_API_LOGS) {

  Api.get = (route) => {
    return new Promise((resolve, reject) => {
      Axios.get(Config.API + route).then((res) => {
        console.log("API GET", route, res.data);
        resolve(res);
      }).catch((err) => {
        console.log("ERROR: API GET", route, err);
        reject(err);
      });
    });
  }

  Api.post = (route, params) => {
    return new Promise((resolve, reject) => {
      Axios.post(Config.API + route, params).then((res) => {
        console.log("API POST", route, params, res.data);
        resolve(res);
      }).catch((err) => {
        console.log("ERROR: API POST", route, params, err);
        reject(err);
      });
    });
  }

  Api.put = (route, params) => {
    return new Promise((resolve, reject) => {
      Axios.put(Config.API + route, params).then((res) => {
        console.log("API PUT", route, params, res.data);
        resolve(res);
      }).catch((err) => {
        console.log("ERROR: API PUT", route, params, err);
        reject(err);
      });
    });
  }

  Api.delete = route => {
    return new Promise((resolve, reject) => {
      Axios.delete(Config.API + route).then((res) => {
        console.log("API DELETE", route, res.data);
        resolve(res);
      }).catch((err) => {
        console.log("ERROR: API DELETE", route, err);
        reject(err);
      });
    });
  }

  Api.run = (source, input) => {
    return new Promise((resolve, reject) => {
      Axios.post("http://localhost:3001/run", { source, input }).then((res) => {
        console.log("API RUN", res);
        resolve(res);
      }).catch((err) => {
        console.log("ERROR: API RUN", err);
        reject(err);
      });
    });
  }

} else {

  Api.get = (route) => {
    return Axios.get(Config.API + route);
  }

  Api.post = (route, params) => {
    return Axios.post(Config.API + route, params);
  }

  Api.put = (route, params) => {
    return Axios.put(Config.API + route, params);
  }

  Api.delete = route => {
    return Axios.delete(Config.API + route);
  }

  Api.run = (source, input) => {
    return Axios.post("http://localhost:3001/run", { source, input });
  }
}