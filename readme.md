# keyv-mongodb

**MongoDB storage adapter for Keyv with support for Mongoose**

## Installation

`mongodb` and `mongoose` are both peerDependecies. Install either one (or both) you'll be using with this package.

```bash
yarn add keyv keyv-mongodb mongoose
# or
yarn add keyv keyv-mongodb mongodb
```

## Compatibility

- Support [Mongoose](http://mongoosejs.com/index.html) `>= 6`
- Support [native MongoDB driver](http://mongodb.github.io/node-mongodb-native/) `>= 4`
- Support Node.js 10-17

### Connection to MongoDB

#### Re-use a Mongoose connection

```js
const mongoose = require('mongoose')

mongoose.connect(connectionOptions)

const keyv = new Keyv({
	store: new KeyvMongoDB({ mongooseConnection: mongoose.connection }),
})
```

#### Re-use a native MongoDB driver connection (or a promise)

```js
const keyv = new Keyv({
	store: new KeyvMongoDB({ db: dbInstance }),
})
```

Or just give a promise...

```js
const keyv = new Keyv({
	store: new KeyvMongoDB({ dbPromise: dbInstancePromise }),
})
```

#### Create a new connection from a MongoDB connection string

[MongoDB connection strings](http://docs.mongodb.org/manual/reference/connection-string/) are **the best way** to configure a new connection. For advanced usage, [more options](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options) can be configured with `mongoOptions` property.

```js
const keyv = new Keyv({
	store: new KeyvMongoDB({ url: 'mongodb://localhost/test-app' }),
})
```

## License

ISC License

Based on work from

- https://github.com/jdesboeufs/connect-mongo
- https://github.com/lukechilds/keyv-mongo
