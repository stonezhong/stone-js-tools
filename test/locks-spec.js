import "babel-polyfill";
import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Lock, sleep } from '../index';

chai.use(chaiAsPromised);

describe('Locks', function() {
    const ctx = {v: []};

    it('lock the object', async () => {

        const lock = new Lock();
        lock.lock('main');

        const t1 = async () => {
            await lock.lock('t1');

            await sleep(5);
            ctx.v.push('t1 a');
            await sleep(5);
            ctx.v.push('t1 b');
            
            lock.unlock('t1');
        };

        const t2 = async () => {
            await lock.lock('t2');

            await sleep(1);
            ctx.v.push('t2 a');
            await sleep(1);
            ctx.v.push('t2 b');

            lock.unlock('t2');
        };

        setTimeout(() => {
            lock.unlock();
        }, 20);

        const v1 = t1();
        const v2 = t2();

        await Promise.all([v1, v2]);

        expect(ctx.v).to.deep.equal(['t1 a', 't1 b', 't2 a', 't2 b']);
    });
});
