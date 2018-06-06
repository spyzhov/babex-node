const SAFE_SIZE = 1024 * 1024; // 1Mb

module.exports = {
    toJSON,
};

/**
 * @param {Buffer} content
 */
function toJSON(content) {
    let data = [];
    let chunk = '';
    let position = 0;
    do {
        chunk = content.toString('utf8', position, position + SAFE_SIZE);
        position += SAFE_SIZE;
        data.push(chunk);
    } while (chunk.length);

    return JSON.parse(data.join(''));
}