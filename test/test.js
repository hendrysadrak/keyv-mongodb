import test from 'ava';
import keyvTestSuite from '@keyv/test-suite';
import Keyv from 'keyv';
import KeyvMongoDB from '..';

const store = () => new KeyvMongoDB({ url: 'mongodb://127.0.0.1:27017/keyv-mongodb-test' });

keyvTestSuite(test, Keyv, store);

// test('Collection option merges into default options', t => {
// 	const store = new KeyvMongoDB({ collection: 'foo' });

// 	t.deepEqual(store.opts, {
// 		url: 'mongodb://127.0.0.1:27017',
// 		collection: 'foo'
// 	});
// });
