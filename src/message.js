const {Path} = require('./path');

class Message {
    constructor(channel, delivery) {
        this.channel = channel;
        this.delivery = delivery;
        this.payload = JSON.parse(this.delivery.content.toString());
        this.data = this.payload.data;
        this.chain = this.payload.chain.map((item) => new Path(item));
        this.headers = this.delivery.properties.headers || {};
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