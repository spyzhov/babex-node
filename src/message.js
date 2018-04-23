const {Path} = require('./path');

class Message {
    constructor(channel, delivery) {
        this.channel = channel;
        this.delivery = delivery;
        this.payload = JSON.parse(this.delivery.content.toString());
        this.data = this.payload.data;
        this.chain = this.payload.chain;
        this.headers = this.delivery.properties.headers || {};
        this.chain.forEach((item) => new Path(item));
    }

    ack() {
        return Promise
            .resolve()
            .then(() => this.channel.ack(this.delivery));
    }
}

module.exports = {
    Message,
};