import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { Organizer } from './Auth';

export class Event extends Model {
    public id!: string;
    public organizer_id!: string;
    public title!: string;
    public description!: string;
    public start_time!: Date;
    public end_time!: Date;
    public session_key!: string | null;
    public is_offline_active!: boolean;
}

Event.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    organizer_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    session_key: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_offline_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize,
    modelName: 'Event',
});

export class BadgeTemplate extends Model {
    public id!: string;
    public event_id!: string;
    public name!: string;
    public type!: string;
    public icon_ref!: string;
    public limit!: number;
    public metadata_schema!: string;
}

BadgeTemplate.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    event_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('Record', 'Certification', 'Achievement', 'Award'),
        allowNull: false,
    },
    icon_ref: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    limit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    metadata_schema: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'BadgeTemplate',
});

// Relationships
Event.belongsTo(Organizer, { foreignKey: 'organizer_id' });
BadgeTemplate.belongsTo(Event, { foreignKey: 'event_id' });
Event.hasMany(BadgeTemplate, { foreignKey: 'event_id' });
