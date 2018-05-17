const amqp = require('amqplib');
const nanoid = require('nanoid');
const {Message} = require('./message');
const errors = require('./errors');

/**
 * Babex service
 */
class Service {

    /**
     * Create enw Babex service
     *
     * @param config
     */
    constructor(config) {
        this.config = config;
        this.name = config.isSingle ? `${config.name}.${nanoid()}` : config.name;
        this.connection = null;
        this.channel = null;
        this.options = config.isSingle ? {exclusive: true, autoDelete: true} : {};
        this.logger = config.logger;
    }

    /**
     * Connect to Ampq and update all references
     *
     * @returns {Promise.<Service>}
     */
    connect() {
        this.log(`Try to connect to ${this.config.address}`);
        return amqp.connect(this.config.address)
            .then((connection) => {
                this.connection = connection;
                process.once('SIGINT', () => this.connection.close());
                this.log(`connected to ${this.config.address}`);

                return this.connection
                    .createChannel()
                    .then((channel) => this.channel = channel)
                    .then(() => this.config.skipDeclareQueue || this.channel.assertQueue(this.name, this.options));
            })
            .then(() => this.log(`waiting for messages on ${this.name}`))
            .then(() => this);
    }

    /**
     * Execute user function on det message from Ampq.
     *
     * @param callback Function with argument Message
     * @returns {*}
     */
    listen(callback) {
        return this.channel.consume(this.name, (delivery) => {
            if (delivery === null) {
                return;
            }
            this.log(`receive message: ${delivery.content.toString()}`);
            return Promise
                .resolve(delivery)
                .then((delivery) => new Message(this.channel, delivery))
                .then(callback)
        });
    }

    /**
     * Bind key to exchange, for current service/queue name
     *
     * @param exchange String
     * @param key String
     * @returns {Promise.<Service>}
     */
    bindToExchange(exchange, key) {
        this.log(`bind to exchange ${exchange}:${key}`);
        return Promise
            .resolve()
            .then(() => this.channel.bindQueue(this.name, exchange, key))
            .then(() => this);
    }

    /**
     * Custom push message in Babex style
     *
     * @param exchange String
     * @param key String
     * @param chain Chain
     * @param data Any
     * @param headers Object
     * @param config Any
     * @returns {Promise.<Service>}
     */
    publishMessage(exchange, key, chain = {}, data = {}, headers = {}, config = null) {
        this.log(`publish message to ${exchange}:${key}`);
        return Promise
            .resolve()
            .then(() => this.channel.publish(exchange, key, new Buffer(JSON.stringify({data, chain, config})), {headers}))
            .then(() => this);
    }

    /**
     * Send message to the next service in chain
     *
     * @param message Message
     * @param payload
     * @param headers
     * @returns {Promise.<Service>}
     */
    next(message, payload, headers) {
        headers = headers || message.headers || {};
        return Promise
            .resolve()
            .then(() => message.ack())
            .then(() => message.chain.find((value) => !value.successful))
            .then((value) => {
                if (!value) {
                    return Promise.reject(errors.ErrorNextIsNotDefined);
                }
                let index = message.chain.indexOf(value);
                if (index < 0 || message.chain.length <= index + 1) {
                    return Promise.reject(errors.ErrorNextIsNotDefined);
                }
                message.chain[index].successful = true;
                return message.chain[index + 1];
            })
            .then((next) => {
                if (!next || !next.exchange || !next.key) {
                    return Promise.reject(errors.ErrorNextIsNotDefined);
                }
                return next;
            })
            .then((next) => {
                let promises = [];
                if (next.isMultiple) {
                    if (!Array.isArray(payload)) {
                        return Promise.reject(errors.ErrorDataIsNotArray);
                    }
                    for (let i = 0; i < payload.length; i++) {
                        promises.push(this.publishMessage(
                            next.exchange,
                            next.key,
                            message.chain,
                            payload[i],
                            headers,
                            message.config
                        ));
                    }
                } else {
                    promises.push(this.publishMessage(
                        next.exchange,
                        next.key,
                        message.chain,
                        payload,
                        headers,
                        message.config
                    ));
                }
                return Promise.all(promises);
            })
            .then(() => this);
    }

    log(message) {
        if (this.logger && this.logger.log) {
            this.logger.log(message);
        }
    }
}

module.exports = {
    Service
};