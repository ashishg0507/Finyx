import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Goal = sequelize.define(
  'Goal',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    targetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currentAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
  },
  {
    tableName: 'goals',
    timestamps: true,
    indexes: [{ fields: ['userId'] }],
  },
)

