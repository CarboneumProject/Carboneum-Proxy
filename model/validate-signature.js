const utils = require('ethereumjs-util');

const message = utils.hashPersonalMessage(utils.toBuffer('Sign into http://localhost'));

module.exports = (sgn) => {
  const r = utils.toBuffer(sgn.slice(0, 66));
  const s = utils.toBuffer('0x' + sgn.slice(66, 130));
  const v = utils.bufferToInt(utils.toBuffer('0x' + sgn.slice(130, 132)));
  const pub = utils.ecrecover(message, v, r, s);
  const address = utils.pubToAddress(pub);
  return utils.bufferToHex(address);
};