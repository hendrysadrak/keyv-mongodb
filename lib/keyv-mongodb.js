const { MongoClient } = require('mongodb')
const { promisify } = require('util')

/**
 * @typedef {{collection: string, url: string}} KeyvMongoDBOptions
 */

class KeyvMongoDB {
	/**
	 * @param {Object} options
	 * @param {string} options.collection
	 * @param {string?} options.url
	 * @param {import('mongodb').MongoClientOptions?} options.mongoOptions
	 * @param {import('mongodb').Db?} options.db
	 * @param {Promise<import('mongodb').Db>?} options.dbPromise
	 * @param {import('mongoose').Connection?} options.mongooseConnection
	 */
	constructor(
		options = {
			collection: 'keyv',
			url: null,
			mongoOptions: {},
			db: null,
			dbPromise: null,
			mongooseConnection: null,
		},
	) {
		this.ttlSupport = false

		this.db = null
		this.collectionName = options.collection || 'keyv'
		this.collection = null

		this.isReadyPromise = new Promise(resolve => (this.setAsReady = resolve))

		const newConnectionCallback = (err, db) => {
			if (err) {
				this.connectionFailed(err)
			} else {
				this.handleNewConnectionAsync(db)
			}
		}

		// New native connection using url + mongoOptions
		if (options.url) {
			MongoClient.connect(
				options.url,
				options.mongoOptions || {},
				(err, client) => {
					newConnectionCallback(err, client.db())
				},
			)
		}

		// Re-use existing or upcoming mongoose connection
		else if (options.mongooseConnection) {
			if (options.mongooseConnection.readyState === 1) {
				this.handleNewConnectionAsync(options.mongooseConnection.db)
			} else {
				options.mongooseConnection.once('open', () =>
					this.handleNewConnectionAsync(options.mongooseConnection.db),
				)
			}
		}

		// Re-use existing or upcoming native connection
		else if (options.db && options.db.listCollections) {
			// OpenCalled is undefined in mongodb@2.x
			if (options.db.openCalled || options.db.openCalled === undefined) {
				this.handleNewConnectionAsync(options.db)
			} else {
				options.db.open(newConnectionCallback)
			}
		} else if (options.dbPromise) {
			options.dbPromise
				.then(db => this.handleNewConnectionAsync(db))
				.catch(err => this.connectionFailed(err))
		} else {
			throw new Error('Connection strategy not found')
		}
	}

	connectionFailed(err) {
		throw err
	}

	handleNewConnectionAsync(db) {
		this.db = db

		// this.db.on('error', err => this.connectionFailed(err))

		const collection = db.collection(this.collectionName)

		return this.setCollection(collection)
	}

	setCollection(collection) {
		this.collection = collection

		collection.createIndex(
			{ key: 1 },
			{
				unique: true,
				background: true,
			},
		)

		collection.createIndex(
			{ expiresAt: 1 },
			{
				expireAfterSeconds: 0,
				background: true,
			},
		)

		this.mongo = ['updateOne', 'findOne', 'deleteMany', 'deleteOne'].reduce(
			(obj, method) => {
				obj[method] = promisify(collection[method].bind(collection))
				return obj
			},
			{},
		)

		this.setAsReady()

		return this
	}

	async get(key) {
		await this.isReadyPromise

		const doc = await this.mongo.findOne({ key })

		if (doc === null) return

		return doc.value
	}

	async set(key, value, ttl) {
		await this.isReadyPromise

		const expiresAt =
			typeof ttl === 'number' ? new Date(Date.now() + ttl) : null

		return this.mongo.updateOne(
			{ key },
			{ $set: { key, value, expiresAt } },
			{ upsert: true },
		)
	}

	async delete(key) {
		if (typeof key !== 'string') return false

		await this.isReadyPromise

		const obj = await this.mongo.deleteOne({ key })

		return obj.deletedCount > 0
	}

	async clear() {
		await this.isReadyPromise

		await this.mongo.deleteMany({ key: new RegExp(`^${this.namespace}:`) })
	}
}

module.exports = KeyvMongoDB
