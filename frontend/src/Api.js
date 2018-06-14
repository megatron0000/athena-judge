import Axios from "axios";

import Config from "./Config";

export default class Api {};

Api.get = (route) => {
  console.log("API GET", route);
  return Axios.get(Config.api + route);
}

Api.post = (route, params) => {
  console.log("API POST", route, params);
  return Axios.post(Config.api + route, params);
}

Api.put = (route, params) => {
  console.log("API PUT", route, params);
  return Axios.put(Config.api + route, params);
}

Api.delete = (route, params) => {
  console.log("API DELETE", route, params);
  return Axios.delete(Config.api + route, params);
}