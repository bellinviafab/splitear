'use strict';

'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si algo falla a mitad de camino, no queda ninguna tabla a medio crear
    await queryInterface.sequelize.transaction(async (transaction) => {

      // 1. users (sin dependencias)
      await queryInterface.createTable('users', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        username: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        salt: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        age: { type: Sequelize.INTEGER },
        name: { type: Sequelize.STRING },
        last_name: { type: Sequelize.STRING },
        alias: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction })

      // 2. grupos (depende de users por creadorId)
      await queryInterface.createTable('grupos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        nombreGrupo: { type: Sequelize.STRING, allowNull: false },
        fechaFin: { type: Sequelize.DATE },
        descripcion: { type: Sequelize.STRING },
        creadorId: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE },
      }, { transaction })

      // 3. pertenencia (tabla intermedia usuario-grupo, clave primaria compuesta)
      await queryInterface.createTable('pertenencia', {
        integranteId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        grupoId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'grupos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE },
      }, { transaction })

      // 4. gastos (depende de users y grupos)
      await queryInterface.createTable('gastos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        descripcion: { type: Sequelize.STRING },
        idCreadorGasto: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        idGrupo: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'grupos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE },
      }, { transaction })

      // 5. detalle_gastos (depende de gastos y users, clave primaria compuesta)
      await queryInterface.createTable('detalle_gastos', {
        idGasto: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'gastos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        idParticipante: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE },
      }, { transaction })

      // Índices en claves foráneas (Postgres no los crea solo)
      await queryInterface.addIndex('gastos', ['idGrupo'], { transaction })
      await queryInterface.addIndex('gastos', ['idCreadorGasto'], { transaction })
      await queryInterface.addIndex('detalle_gastos', ['idParticipante'], { transaction })
      await queryInterface.addIndex('pertenencia', ['grupoId'], { transaction })
    })
  },

  async down(queryInterface) {
    // Orden inverso: primero las tablas que dependen de otras
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('detalle_gastos', { transaction })
      await queryInterface.dropTable('gastos', { transaction })
      await queryInterface.dropTable('pertenencia', { transaction })
      await queryInterface.dropTable('grupos', { transaction })
      await queryInterface.dropTable('users', { transaction })
    })
  },
}
