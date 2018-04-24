const errors = require('./src/errors');
const {Service} = require('./src/service');

const serviceConfig = {
    name: "",
    address: 'amqp://localhost',
    isSingle: true,
    skipDeclareQueue: false,
};

function newService(config) {
    return new Service(config).connect();
}

module.exports = {
    newService,
    config: serviceConfig,
    errors,
};