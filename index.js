const amqp = require('amqplib');
const nanoid = require('nanoid');
const errors = require('./src/errors');
const {Message} = require('./src/message');

const serviceConfig = {
    name: "",
    address: 'amqp://localhost',
    isSingle: true,
    skipDeclareQueue: false,
};

class Service {
    constructor(config) {
        this.config = config;
        this.name = config.isSingle ? `${config.name}.${nanoid()}` : config.name;
        this.connection = null;
        this.channel = null;
        this.options = config.isSingle ? {exclusive: true, autoDelete: true} : {};
    }

    connect() {
        console.log((new Date()) + ` Babex: Try to connect to ${this.config.address}`);
        return amqp.connect(this.config.address)
            .then((connection) => {
                this.connection = connection;
                process.once('SIGINT', () => this.connection.close());
                console.log((new Date()) + ` Babex: connected to ${this.config.address}`);

                return this.connection
                    .createChannel()
                    .then((channel) => this.channel = channel)
                    .then(() => this.config.skipDeclareQueue || this.channel.assertQueue(this.name, this.options));
            })
            .then(() => console.log((new Date()) + ` Babex: waiting for messages on ${this.name}`))
            .then(() => this);
    }

    listen(callback) {
        return this.channel.consume(this.name, function (delivery) {
            if (delivery === null) {
                return;
            }
            console.log((new Date()) + ' Babex: receive message: ' + delivery.content.toString());
            return Promise
                .resolve(delivery)
                .then((delivery) => new Message(this.channel, delivery))
                .then(callback)
        });
    }

    bindToExchange(exchange, key) {
        console.log((new Date()) + ` Babex: bind to exchange ${exchange}:${key}`);
        return Promise
            .resolve()
            .then(() => this.channel.bindQueue(this.name, exchange, key))
            .then(() => this);
    }

    publishMessage(exchange, key, chain = {}, data = {}, headers = {}) {
        console.log((new Date()) + ` Babex: publish message to ${exchange}:${key}`);
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

function newService(config) {
    return new Service(config).connect();
}

module.exports = {
    newService,
    config: serviceConfig,
    errors,
};