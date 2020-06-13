test('test runs', async () => {
    const action = require('./index.js');
    await action.run()
}, 30_000);