import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const SentMonthlySummary = sequelize.define(
  'SentMonthlySummary',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    /** YYYY-MM — month that was summarized */
    monthKey: { type: DataTypes.STRING(7), allowNull: false },
  },
  {
    tableName: 'sent_monthly_summaries',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'monthKey'] }],
  },
)
