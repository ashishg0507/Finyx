import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Budget = sequelize.define(
  'Budget',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    monthKey: { type: DataTypes.STRING(7), allowNull: false }, // YYYY-MM
    category: { type: DataTypes.STRING(64), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  {
    tableName: 'budgets',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'monthKey', 'category'] }],
  },
)

