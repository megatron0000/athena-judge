import Sequelize from "sequelize";
import Path from "path";

export const DB = new Sequelize("athena", "athena", "athena", {
  host: "localhost",
  dialect: "postgres"
});

export const PORT = 3000;

export const UPLOADS_DIR = Path.resolve(__dirname, "..", "uploads");
