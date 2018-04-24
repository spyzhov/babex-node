const errors = require('./src/errors');
const {Service} = require('./src/service');

const serviceConfig = {
    name: "",
    address: 'amqp://localhost',
    isSingle: true,
    skipDeclareQueue: false,
};

/**
 * Create new service, with instant connect.
 *
 * @param config
 * @returns {Promise.<Service>}
 */
function newService(config) {
    return new Service(config).connect();
}

module.exports = {
    newService,
    config: serviceConfig,
    errors,
};