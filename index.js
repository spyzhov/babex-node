const amqp = require('amqplib');
const nanoid = require('nanoid');

const serviceConfig = {
    name: "",
    address: 'amqp://localhost',
    isSingle: true,
    skipDeclareQueue: false,
};
const errors = {
    ErrorNextIsNotDefined: 'ErrorNextIsNotDefined',
    ErrorDataIsNotArray: 'ErrorDataIsNotArray',
};

class ChainItem {
    constructor(item) {
        this.successful = !!item.successful;
        this.isMultiple = !!item.isMultiple;
        this.exchange = item.exchange.toString();
        this.key = item.key.toString();
    }
}

class Message {
    constructor(channel, delivery) {
        this.channel = channel;
        this.delivery = delivery;
        this.payload = JSON.parse(this.delivery.content.toString());
        this.data = this.payload.data;
        this.chain = this.payload.chain;
        this.headers = this.delivery.properties.headers || {};
        this.chain.forEach((item) => new ChainItem(item));
    }

    ack() {
        return Promise
            .resolve()
            .then(() => this.channel.ack(this.delivery));
    }
}

class Service {
    constructor(config) {
        this.config = config;
        this.name = config.isSingle ? `${config.name}.${nanoid()}` : config.name;
        this.connection = null;
        this.channel = null;
    }

    connect() {
        console.log((new Date()) + ` Babex: Try to connect to ${this.config.address}`);
        return amqp.connect(this.config.address)
            .then((conn) => {
                this.connection = conn;
                process.once('SIGINT', () => this.connection.close());
                console.log((new Date()) + ` Babex: connected to ${this.config.address}`);

                return this.connection
                    .createChannel()
                    .then((ch) => {
                        this.channel = ch;
                        if (!this.config.skipDeclareQueue) {
                            return this.channel.then(() => this.channel.assertQueue(this.name));
                        }
                    });
            })
            .then(() => console.log((new Date()) + ` Babex: waiting for messages on ${this.name}`))
            .then(() => this);
    }

    listen(callback) {
        return this.channel.consume(queue, function (delivery) {
            if (delivery === null) {
                return;
            }
            console.log((new Date()) + ' Receive message: ' + delivery.content.toString());
            return Promise
                .resolve(delivery)
                .then((delivery) => new Message(this.channel, delivery))
                .then(callback)
        });
    }

    bindToExchange(exchange, key) {
        return this.channel.bindQueue(this.name, exchange, key);
    }

    publishMessage(exchange, key, chain = {}, data = {}, headers = {}) {
        console.log((new Date()) + ` Babex: publish message to ${exchange}:${key}`);
        return this.channel.publish(exchange, key, new Buffer(JSON.stringify({data, chain})), {headers});
    }

    next(message, payload, headers = {}) {
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
            });
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