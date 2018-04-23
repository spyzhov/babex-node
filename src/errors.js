
class ErrorNextIsNotDefined extends Error {
    constructor(message) {
        super(message);
        this.name = 'ErrorNextIsNotDefined';
    }
}
class ErrorDataIsNotArray extends Error {
    constructor(message) {
        super(message);
        this.name = 'ErrorDataIsNotArray';
    }
}

module.exports = {
    ErrorNextIsNotDefined,
    ErrorDataIsNotArray,
};