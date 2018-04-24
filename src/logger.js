
function get_logger(level) {
    return (message) => console[level](`${new Date()} Babex: ${message}`);
}

module.exports = {
    log: get_logger('log'),
    info: get_logger('info'),
    warn: get_logger('warn'),
    error: get_logger('error'),
    debug: get_logger('debug'),
};