import * as utils from '../src/utils';

describe('Utils tests', () => {
  it('checking readEnv', async () => {
    process.env['test'] = 'pay-gateway';
    expect(await utils.readEnv('test')).toBe('pay-gateway');
    expect(await utils.readEnv('undefined')).toBe('');
  });
});
