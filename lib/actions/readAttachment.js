/* eslint-disable no-await-in-loop */
const { Duplex } = require('stream');
const { wrapper, AttachmentProcessor } = require('@blendededge/ferryman-extensions');
const readline = require('readline');
const sizeof = require('object-sizeof');
const { newMessageWithBody } = require('../messages');

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 5242880; // 5 MiB

function checkFileName(self, fileName, pattern) {
  if (fileName === undefined) {
    return false;
  }

  if (!pattern.test(fileName)) {
    self.logger.debug('Filename does not match pattern');
    return false;
  }

  if (fileName.split('.').pop() !== 'jsonl') {
    self.logger.debug('Provided fileName is not .jsonl file');
    return false;
  }

  return true;
}

module.exports.process = async function processAction(msg, cfg, snapshot, headers, tokenData = {}) {
  const self = await wrapper(this, msg, cfg, snapshot, headers, tokenData);
  const { attachments } = msg;
  const TOKEN = process.env.ELASTICIO_IAM_TOKEN || tokenData.apiKey;
  const pattern = new RegExp(cfg !== undefined ? cfg.pattern || '(.jsonl)' : '(.jsonl)');
  let foundJSONL = false;

  self.logger.info('Attachment to JSONL started');
  self.logger.info('Found %s attachments', Object.keys(attachments || {}).length);

  function bufferToStream(buffer) {
    const stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async function processLineByLine(stream) {
    const result = { data: [] };
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    // eslint-disable-next-line no-restricted-syntax
    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      console.log(`Line from file: ${line}`);
      result.data.push(JSON.parse(line));
    }
    self.logger.debug(`Parsed JSONL file is ${JSON.stringify(result.data)}`);
    return result;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(attachments)) {
    const attachment = attachments[key];
    const fileName = key;
    // get file size based attachment object may not be define or be accurate
    let fileSize = attachment.size;
    self.logger.info('Processing attachment');

    if (cfg.validateExtension && !checkFileName(self, fileName, pattern)) {
      self.logger.debug(`Skipping attachment ${fileName}, which is not a jsonl file.`);
    } else if (fileSize === undefined || fileSize < MAX_FILE_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      const response = await new AttachmentProcessor(self, TOKEN, cfg.attachmentServiceUrl).getAttachment(attachment.url, 'arraybuffer');

      self.logger.debug(`For provided filename response status: ${response.status}`);

      if (response.status >= 400) {
        throw new Error(`Error in making request to ${attachment.url}
                                    Status code: ${response.status},
                                    Body: ${Buffer.from(response.data, 'binary').toString('base64')}`);
      }

      const responseBodyBuffer = Buffer.from(response.data, 'binary');

      if (!responseBodyBuffer) {
        throw new Error(`Empty attachment received for file ${fileName}`);
      }

      fileSize = sizeof(responseBodyBuffer);

      if (fileSize < MAX_FILE_SIZE) {
        const stream = bufferToStream(responseBodyBuffer);
        const returnMsg = await processLineByLine(stream);
        self.logger.debug('Attachment parsing of JSONL finished');
        foundJSONL = true;
        await self.emit('data', newMessageWithBody(returnMsg.data));
      } else {
        throw new Error(`Attachment ${key} is too large to be processed my JSONL component.`
          + ` File limit is: ${MAX_FILE_SIZE} byte, file given was: ${fileSize} byte.`);
      }
    } else {
      throw new Error(`Attachment ${key} is too large to be processed my JSONL component.`
        + ` File limit is: ${MAX_FILE_SIZE} byte, file given was: ${fileSize} byte.`);
    }
  }
  if (!foundJSONL) {
    self.logger.info('No JSONL files that match the pattern found within attachments');
  }
  self.emit('end');
};

// eslint-disable-next-line no-unused-vars, no-empty-function
exports.getMetaModel = async function getMetaModel(cfg) {};
