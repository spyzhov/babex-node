const amqp = require('amqplib');
const nanoid = require('nanoid');
const {Message} = require('./message');
const errors = require('./errors');
const logger = require('./logger');

class Service {
    constructor(config) {
        this.config = config;
        this.name = config.isSingle ? `${config.name}.${nanoid()}` : config.name;
        this.connection = null;
        this.channel = null;
        this.options = config.isSingle ? {exclusive: true, autoDelete: true} : {};
    }

    connect() {
        logger.log(`Try to connect to ${this.config.address}`);
        return amqp.connect(this.config.address)
            .then((connection) => {
                this.connection = connection;
                process.once('SIGINT', () => this.connection.close());
                logger.log(`connected to ${this.config.address}`);

                return this.connection
                    .createChannel()
                    .then((channel) => this.channel = channel)
                    .then(() => this.config.skipDeclareQueue || this.channel.assertQueue(this.name, this.options));
            })
            .then(() => logger.log(`waiting for messages on ${this.name}`))
            .then(() => this);
    }

    listen(callback) {
        return this.channel.consume(this.name, (delivery) => {
            if (delivery === null) {
                return;
            }
            logger.log('receive message: ' + delivery.content.toString());
            return Promise
                .resolve(delivery)
                .then((delivery) => new Message(this.channel, delivery))
                .then(callback)
        });
    }

    bindToExchange(exchange, key) {
        logger.log(`bind to exchange ${exchange}:${key}`);
        return Promise
            .resolve()
            .then(() => this.channel.bindQueue(this.name, exchange, key))
            .then(() => this);
    }

    publishMessage(exchange, key, chain = {}, data = {}, headers = {}) {
        logger.log(`publish message to ${exchange}:${key}`);
        return Promise
            .resolve()
            .then(() => this.channel.publish(exchange, key, new Buffer(JSON.stringify({data, chain})), {headers}))
            .then(() => this);
    }

    next(message, payload, headers) {
        headers = headers || message.headers || {};
        return Promise
            .resolve()
            .then(() => this.channel.ack(message.delivery))
            .then(() => message.chain.find((value) => !value.successful))
            .then((value) => {
                if (!value) {
                    throw errors.ErrorNextIsNotDefined;
                }
                let index = message.chain.indexOf(value);
                if (index < 0 || message.chain.length <= index + 1) {
                    throw errors.ErrorNextIsNotDefined;
                }
                message.chain[index].successful = true;
                return message.chain[index + 1];
            })
            .then((next) => {
                if (!next || !next.exchange || !next.key) {
                    throw errors.ErrorNextIsNotDefined;
                }
                return next;
            })
            .then((next) => {
                let promises = [];
                if (next.isMultiple) {
                    if (!Array.isArray(payload)) {
                        throw errors.ErrorDataIsNotArray;
                    }
                    for (let i = 0; i < payload.length; i++) {
                        promises.push(this.publishMessage(next.exchange, next.key, message.chain, payload[i], headers));
                    }
                } else {
                    promises.push(this.publishMessage(next.exchange, next.key, message.chain, payload, headers));
                }
                return Promise.all(promises);
            })
            .then(() => this);
    }
}

module.exports = {
    Service
};