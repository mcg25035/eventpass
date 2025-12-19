import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './Auth';
import { Event, BadgeTemplate } from './Event';

export class Record extends Model {
    public id!: string;
    public user_id!: string;
    public event_id!: string;
    public badge_template_id!: string;
    public issued_at!: Date;
    public data!: string; // JSON
    public hash!: string;
}

Record.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    event_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    badge_template_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Record',
});

export class PendingValidation extends Model {
    public id!: number;
    public event_id!: string;
    public user_id!: string;
    public verification_hash!: string;
    public created_at!: Date;
}

PendingValidation.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    event_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    verification_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'PendingValidation',
    timestamps: false,
});

// Relationships
Record.belongsTo(User, { foreignKey: 'user_id' });
Record.belongsTo(Event, { foreignKey: 'event_id' });
Record.belongsTo(BadgeTemplate, { foreignKey: 'badge_template_id' });
