import { 
    TopicManager, 
    BasicTopic,
    queryBuilder,
} from './topic-manager/index';

class MyTopic extends BasicTopic {
    constructor({value}) {
        super();
        this.value = value;
        this.version = 0;
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

function sleep(duration) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, duration);
    });
}

async function applyChanges({topicManager, topicId1, topicId2}) {
    await sleep(1000);
    topicManager.applyChange(topicId1, 'add', null, {delta: 7});
    await sleep(1000);
    topicManager.applyChange(topicId2, 'sub', null, {delta: 2});
    await sleep(1000);
}

async function testMain() {
    const topicManager = new TopicManager();
    const topic1 = new MyTopic({value: 10});
    const topic2 = new MyTopic({value: 8});
    const topicId1 = topicManager.registerTopic(topic1);
    const topicId2 = topicManager.registerTopic(topic2);
    console.log(`Topic1 '${topicId1}' is registered`);
    console.log(`Topic2 '${topicId2}' is registered`);

    applyChanges({topicManager, topicId1, topicId2});

    const query1 = queryBuilder()
        .set(topicId1).build();
    const query2 = queryBuilder()
        .set(topicId2)
        .set(topicId1)
        .build();

    let result;

    result = await topicManager.query({
        query: query1,
        timeoutInMS: 5000,
    });
    console.log(JSON.stringify(result));
    queryBuilder(query1).set(topicId1, result.topics[topicId1].version).build();

    result = await topicManager.query({
        query: query2,
        timeoutInMS: 5000,
    });
    console.log(JSON.stringify(result));
    queryBuilder(query2)
        .set(topicId1, result.topics[topicId1].version)
        .set(topicId2, result.topics[topicId2].version)
        .build();

    result = await topicManager.query({
        query: query1,
        timeoutInMS: 5000,
    });
    console.log(JSON.stringify(result));

    result = await topicManager.query({
        query: query2,
        timeoutInMS: 5000,
    });
    console.log(JSON.stringify(result));
    
    console.log('Done!');
}

testMain();

