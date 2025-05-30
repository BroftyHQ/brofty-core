import { DataTypes } from 'sequelize';
import sequelize from './client.js';

const message_model = sequelize.define('Message', {
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

export {
    message_model,
}