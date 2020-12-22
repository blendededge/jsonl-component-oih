/* eslint-disable no-await-in-loop */
const sizeof = require('object-sizeof');
const { messages } = require('elasticio-node');
const { AttachmentProcessor } = require('../AttachmentProcessor');
const readline = require('readline');

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

module.exports.process = async function processAction(msg, cfg) {
  const self = this;
  const { attachments } = msg;
  const pattern = new RegExp(cfg !== undefined ? cfg.pattern || '(.jsonl)' : '(.jsonl)');
  let foundJSONL = false;

  self.logger.info('Attachment to JSONL started');
  self.logger.info('Found %s attachments', Object.keys(attachments || {}).length);

  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(attachments)) {
    const attachment = attachments[key];
    const fileName = key;
    // get file size based attachment object may not be define or be accurate
    let fileSize = attachment.size;
    self.logger.info('Processing attachment');

    if (checkFileName(self, fileName, pattern)) {
      if (fileSize === undefined || fileSize < MAX_FILE_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        const response = await new AttachmentProcessor(process.env.ELASTICIO_IAM_TOKEN).getAttachment(attachment.url, 'arraybuffer');

        this.logger.debug(`For provided filename response status: ${response.status}`);

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
//          const returnMsg = await xml2Json.process(this, responseBodyString);
          const returnMsg = await this.processLineByLine(responseBodyBuffer);
          this.logger.debug('Attachment parsing of JSONL finished');
          foundJSONL = true;
          await self.emit('data', messages.newMessageWithBody(returnMsg.body));
        } else {
          throw new Error(`Attachment ${key} is too large to be processed my JSONL component.`
            + ` File limit is: ${MAX_FILE_SIZE} byte, file given was: ${fileSize} byte.`);
        }
      } else {
        throw new Error(`Attachment ${key} is too large to be processed my JSONL component.`
          + ` File limit is: ${MAX_FILE_SIZE} byte, file given was: ${fileSize} byte.`);
      }
    } else {
      this.logger.debug(`Skipping attachment ${fileName}, which is not a jsonl file.`)
    }
  }
  if (!foundJSONL) {
    self.logger.info('No JSONL files that match the pattern found within attachments');
  }
};

async function processLineByLine(stream) {
  const result = {body: []};
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
    result.data.append(JSON.parse(line));
  }
  this.logger.debug(`Parsed JSONL file is ${data}`);
}


exports.getMetaModel = async function getMetaModel(cfg) {};
