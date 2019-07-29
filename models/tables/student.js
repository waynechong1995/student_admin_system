module.exports = (sequelize, DataTypes) =>
    sequelize.define('student', {
            id: {
                type: DataTypes.BIGINT,
                field: 'id',
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(255),
                field: 'email',
                allowNull: false,
                defaultValue: '',
            },
            suspended: {
                type: DataTypes.INTEGER(1),
                field: 'suspended',
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
            classMethods: {
                associate(models) {
                    models.student.hasMany(models.class, {as: 'class', foreignKey: 'studentid'});
                },
            },
            freezeTableName: true,
            timestamps: false,
            indexes: []
        });