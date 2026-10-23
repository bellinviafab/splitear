const S = require('sequelize')
const db = require('../db')
const bcrypt = require("bcrypt")

class User extends S.Model { //Declara clase user y hereda modelo de sequelize
    async validarPassword(password) {
        return await bcrypt.hash(password, this.salt) === this.password;
    }
}

User.init({
    username: {
        type: S.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: S.STRING,
        allowNull: false,
    },
    salt: {
        type: S.STRING
    },
    email: {
        type: S.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true //Validación nativa de sequelize
        }
    },
    age: {
        type: S.INTEGER
    },
    name: {
        type: S.STRING,
        allowNull: true
    },
    last_name: {
        type: S.STRING,
        allowNull: true
    },
    alias: {
        type: S.STRING
    },
    /*image: {
        type: S.STRING,
        allowNull: true
    },*/
}, { sequelize: db, modelName: "user", })  //Implementar defualtScope y specialScope

User.beforeCreate(async (user) => {  //beforeCreate es un hook a nivel capa de aplicación o trigger a nivel bd
    try {
        const salt = await (bcrypt.genSalt(10));
        user.salt = salt
        user.password = await bcrypt.hash(user.password, salt)
    } catch (error) {
        throw error;
    }
})


module.exports = User