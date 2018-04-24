/**
 * Path to the service
 */
class Path {

    /**
     * Create new path to the service
     *
     * @param item
     */
    constructor(item) {
        this.successful = Boolean(item.successful);
        this.isMultiple = Boolean(item.isMultiple);
        this.exchange = String(item.exchange);
        this.key = String(item.key);
    }
}

module.exports = {
    Path
};