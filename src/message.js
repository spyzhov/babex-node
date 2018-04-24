const {Path} = require('./path');

/**
 * Base message
 */
class Message {

    /**
     * Create new message from channel data and delivery message
     *
     * @param channel
     * @param delivery
     */
    constructor(channel, delivery) {
        this.channel = channel;
        this.delivery = delivery;
        this.payload = JSON.parse(this.delivery.content.toString());
        this.data = this.payload.data;
        this.chain = this.payload.chain.map((item) => new Path(item));
        this.headers = this.delivery.properties.headers || {};
    }

    /**
     * Mark ACK on current message
     *
     * @returns {Promise.<TResult>}
     */
    ack() {
        return Promise
            .resolve()
            .then(() => this.channel.ack(this.delivery));
    }
}

module.exports = {
    Message,
};