const errors = require('./src/errors');
const {Service} = require('./src/service');
const logger = require('./src/logger');

const serviceConfig = {
    name: "",
    address: 'amqp://localhost',
    isSingle: true,
    skipDeclareQueue: false,
    logger
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
    Service,
    config: serviceConfig,
    errors,
};