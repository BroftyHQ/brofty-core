import { DataTypes } from "sequelize";
import sequelize from "./client.js";

const message_model = sequelize.define("Message", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
});

const user_preference_model = sequelize.define("UserPreference", {
  preference_key: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  preference_value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const tools_model = sequelize.define("Tool", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  defination: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  mcp_server: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const mcp_server_model = sequelize.define("MCPServer", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  command: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  args: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  envs: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "stopped",
  },
});

export { message_model, user_preference_model, tools_model, mcp_server_model };
