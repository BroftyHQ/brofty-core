import { dirname } from "path";
import { Sequelize } from "sequelize";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: `${__dirname}/database.sqlite`,
});

export default sequelize;