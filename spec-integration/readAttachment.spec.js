const { expect } = require('chai');
const process = require('../lib/actions/readAttachment');

const msg = {
  body: {},
};
const cfg = {};

xdescribe('Tests for action', () => {
  it('should do action things correctly', async () => {
    const result = await process.call(msg, cfg);
    expect(result).to.be.equal(undefined);
  });
});
