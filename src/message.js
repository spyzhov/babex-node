const {Path} = require('./path');
const {toJSON} = require('./json');

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
        this.payload = toJSON(this.delivery.content);
        this.data = this.payload.data;
        this.chain = this.payload.chain.map((item) => new Path(item));
        this.headers = this.delivery.properties.headers || {};
        this.config = this.payload.config || null;
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