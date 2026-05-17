import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Transaction = sequelize.define(
  'Transaction',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(64), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    indexes: [{ fields: ['userId', 'date'] }],
  },
)

