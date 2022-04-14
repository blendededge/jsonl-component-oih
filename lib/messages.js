const uuid = require('uuid');

function newEmptyMessage() {
  return {
    id: uuid.v4(),
    attachments: {},
    data: {},
    headers: {},
    metadata: {},
  };
}

function newMessageWithBody(body) {
  const msg = newEmptyMessage();
  msg.data = body;
  return msg;
}

exports.newEmptyMessage = newEmptyMessage;
exports.newMessageWithBody = newMessageWithBody;
