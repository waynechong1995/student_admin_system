module.exports = (sequelize, DataTypes) =>
    sequelize.define('class', {
            id: {
                type: DataTypes.BIGINT,
                field: 'id',
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            teacherid: {
                type: DataTypes.INTEGER(32),
                field: 'teacherid',
                allowNull: false,
                defaultValue: 0,
            },
            studentid: {
                type: DataTypes.INTEGER(32),
                field: 'studentid',
                allowNull: false,
                defaultValue: 0,
            },
            timestamp_created: {
                type: DataTypes.INTEGER(32),
                field: 'timestamp_created',
                allowNull: false,
                defaultValue: 0,
            },
            timestamp_updated: {
                type: DataTypes.INTEGER(32),
                field: 'timestamp_updated',
                allowNull: false,
                defaultValue: 0,
            },
            deleted: {
                type: DataTypes.INTEGER(1),
                field: 'deleted',
                allowNull: false,
                defaultValue: 0,
            }
        },
        {
            freezeTableName: true,
            timestamps: false,
            indexes: []
        });

