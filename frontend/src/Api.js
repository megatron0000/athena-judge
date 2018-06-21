import Axios from "axios";

import Config from "./Config";

export default class Api {};

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

  Api.delete = (route, params) => {
    return new Promise((resolve, reject) => {
      Axios.delete(Config.API + route, params).then((res) => {
        console.log("API DELETE", route, params, res.data);
        resolve(res);
      }).catch((err) => {
        console.log("ERROR: API DELETE", route, params, err);
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

  Api.delete = (route, params) => {
    return Axios.delete(Config.API + route, params);
  }

}