import "babel-polyfill";
import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { TopicManager, BasicTopic, queryBuilder } from '../topic-manager/index';

chai.use(chaiAsPromised);

class MyTopic extends BasicTopic {
    constructor({value, topicId}) {
        super();
        this.value = value;
        this.topicId = topicId;
        this.version = 0;
    }

    getTopicId() {
        return this.topicId;
    }

    applyChange(action, subAction, {delta}) {
        if (action === 'add') {
            this.value += delta;
            this.version ++;
            return;
        }

        if (action === 'sub') {
            this.value -= delta;
            this.version ++;
            return;
        }

        throw new Error('Invalid action');
    }

    getChanges(fromVersion, toVersion) {
        // we do not maintain version history
        return null;
    }
 
    getCurrentVersion() {
        return this.version;

    }

    getState(version) {
        if (version !== this.version) {
            throw new Error('wrong version');
        }
        return {value: this.value};
    }
}


describe('TopicManager', function() {
    const ctx = {};

    beforeEach(() => {
        ctx.topicManager = new TopicManager();
        ctx.topicManager.addTopicFactory((topicId) => {
            if (topicId === 'a') {
                return new MyTopic({topicId: 'a', value: 10});
            }
            if (topicId === 'b') {
                return new MyTopic({topicId: 'b', value: 20});
            }
            return null;
        });
    });

    describe('when client has no version', () => {
        it('should return initial status', async () => {
            const expectedResult = {
                topics: {
                    a: {
                        version: 0,
                        state: { value: 10 },
                        changes: null,
                    },
                },
            };
            const result = await ctx.topicManager.query({
                query: {a: -1}
            });
            expect(result).to.deep.equal(expectedResult);
        });

        it('should return updated status if updated', async () => {
            await ctx.topicManager.applyChange('a', 'add', '', {delta: 5});
            await ctx.topicManager.applyChange('a', 'sub', '', {delta: 1});
            const expectedResult = {
                topics: {
                    a: {
                        version: 2,
                        state: { value: 14 },
                        changes: null,
                    },
                },
            };
            const result = await ctx.topicManager.query({
                query: {a: -1}
            });
            expect(result).to.deep.equal(expectedResult);
        });
    });

    describe('when client has version', () => {
        it('should return nothing if timeout set but no change', async () => {
            const expectedResult = {
                topics: { }
            };
            const result = await ctx.topicManager.query({
                query: {a: 0},
                timeoutInMS: 10,
            });
            expect(result).to.deep.equal(expectedResult);
        });

        it('should only return topic that is mature', async () => {
            const expectedResult = {
                topics: {
                    a: {
                        version: 1,
                        state: { value: 11 },
                        changes: null,
                    },
                },
            };
            await ctx.topicManager.applyChange('a', 'add', '', {delta: 1});
            const result = await ctx.topicManager.query({
                query: {a: 0, b: 0},
                timeoutInMS: 10,
            });
            expect(result).to.deep.equal(expectedResult);
        });

        it('should return if a topic is updated asynchronously', async () => {
            const expectedResult = {
                topics: {
                    a: {
                        version: 1,
                        state: { value: 11 },
                        changes: null,
                    },
                },
            };
            setTimeout(() => {
                ctx.topicManager.applyChange('a', 'add', '', {delta: 1});
            }, 10);
            
            const result = await ctx.topicManager.query({
                query: {a: 0},
                timeoutInMS: 86400000,
            });
            expect(result).to.deep.equal(expectedResult);
        });
    });
});
