class Path {
    constructor(item) {
        this.successful = !!item.successful;
        this.isMultiple = !!item.isMultiple;
        this.exchange = item.exchange.toString();
        this.key = item.key.toString();
    }
}

module.exports = {
    Path
};