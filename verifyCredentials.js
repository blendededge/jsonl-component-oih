const Client = require('');

module.exports = async function verify(credentials, callback) {
  try {
    const client = new Client(credentials);
    const requestOptions = {};
    await client.makeRequest(requestOptions);
    
    callback(null, { verified: true });
  } catch (e) {
    callback(null, { verified: false });
  }
};
