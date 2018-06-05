/**
 * Logger function
 *
 * @param level
 * @returns {function(*): *}
 */
function get_logger(level) {
    return (message) => console[level](`${new Date()} Babex: ${message}`);
}

module.exports = {
    log: get_logger('log')
};