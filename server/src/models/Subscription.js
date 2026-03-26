import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Subscription = sequelize.define(
  'Subscription',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    planId: { type: DataTypes.STRING(32), allowNull: false },
    status: { type: DataTypes.ENUM('created', 'paid'), allowNull: false, defaultValue: 'created' },
    razorpayOrderId: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    razorpayPaymentId: { type: DataTypes.STRING(128), allowNull: true },
    razorpaySignature: { type: DataTypes.STRING(255), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [{ fields: ['userId', 'isActive', 'planId'] }],
  },
)

