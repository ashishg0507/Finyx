import { User } from './User.js'
import { Transaction } from './Transaction.js'
import { Budget } from './Budget.js'
import { Goal } from './Goal.js'
import { GoalContribution } from './GoalContribution.js'
import { Subscription } from './Subscription.js'

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' })
Transaction.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' })
Budget.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' })
Goal.belongsTo(User, { foreignKey: 'userId' })

Goal.hasMany(GoalContribution, { foreignKey: 'goalId', onDelete: 'CASCADE' })
GoalContribution.belongsTo(Goal, { foreignKey: 'goalId' })

User.hasMany(GoalContribution, { foreignKey: 'userId', onDelete: 'CASCADE' })
GoalContribution.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Subscription, { foreignKey: 'userId', onDelete: 'CASCADE' })
Subscription.belongsTo(User, { foreignKey: 'userId' })

export { User, Transaction, Budget, Goal, GoalContribution, Subscription }

