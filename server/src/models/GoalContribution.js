import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const GoalContribution = sequelize.define(
  'GoalContribution',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    goalId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    note: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: 'goal_contributions',
    timestamps: true,
    indexes: [{ fields: ['userId', 'goalId', 'date'] }],
  },
)

