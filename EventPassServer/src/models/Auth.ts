import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
    public id!: string;
    public username!: string;
    public email!: string;
    public password_hash!: string;
    public isOrganizer!: boolean;
}

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isOrganizer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'Users', // Explicitly define table name
});


