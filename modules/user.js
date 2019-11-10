
'use strict'

const bcrypt = require('bcrypt-promise')
const fs = require('fs-extra')
const mime = require('mime-types')
const sqlite = require('sqlite-async')
const saltRounds = 10

const Validator = require('./userVal')

module.exports = class User {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, email TEXT, pass TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	async register(user, email, pass) {
		try {
			
			if(user.length === 0) throw new Error('missing username')
			if(email.lenght === 0) throw new Error('missing email')
			if(user.length === 0) throw new Error('missing user')
			if(pass.length === 0) throw new Error('missing password')
			let sql = `SELECT COUNT(id) as records FROM users WHERE user="${user}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`user "${user}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			sql = `INSERT INTO users(user, email, pass) VALUES("${user}", "${email}", "${pass}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}

	async uploadPicture(path, mimeType, user) {
		const extension = mime.extension(mimeType)
		// console.log(`path: ${path}`)
		// console.log(`extension: ${extension}`)
		await fs.copy(path, `public/avatars/${user}.${extension}`)
	}

	async login(user, password) {
		try {
			let sql = `SELECT count(id) AS count FROM users WHERE user="${user}";`
			const records = await this.db.get(sql)
			if(!records.count) throw new Error(`user "${user}" not found`)
			sql = `SELECT pass FROM users WHERE user = "${user}";`
			const record = await this.db.get(sql)
			const valid = await bcrypt.compare(password, record.pass)
			if(valid === false) throw new Error(`invalid password for account "${user}"`)
			return true
		} catch(err) {
			throw err
		}
	}

}
