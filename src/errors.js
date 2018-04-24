/**
 * Next path is not set in chain
 */
class ErrorNextIsNotDefined extends Error {
    constructor(message = 'Next path is not set in chain') {
        super(message);
        this.name = 'ErrorNextIsNotDefined';
    }
}

/**
 * Path mark as `isMultiple`, but send data is not array type
 */
class ErrorDataIsNotArray extends Error {
    constructor(message = 'Path mark as `isMultiple`, but send data is not array type') {
        super(message);
        this.name = 'ErrorDataIsNotArray';
    }
}

module.exports = {
    ErrorNextIsNotDefined,
    ErrorDataIsNotArray,
};