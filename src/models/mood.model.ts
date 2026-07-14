import { DataTypes } from "sequelize";
import Sequelize from "sequelize";

const Mood = Sequelize.define("Mood", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  mood: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: "moods",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default Mood;