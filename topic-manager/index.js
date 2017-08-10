import _ from 'lodash';

function addToSet(target, source) {
    _.forEach(source, (element) => {
        target.add(element);
    });
}

export class BasicTopic {
    /**
     * @return {string} A unique topic id
     */
    getTopicId() {

    }

    /**
     * Apply change to a topic
     * Derived class need to implement this method
     * @abstract
     * @param {string} action
     * @param {string} subAction
     * @param {Object} payload
     */
    applyChange(action, subAction, payload) {
        throw new Error('Abstract method');
    }

    /**
     * Get changes between fromVersion and toVersion
     * return null if this topic does not support getting changes
     * @param {number} fromVersion
     * @param {number} toVersion
     * @return {Array}
     */
    getChanges(fromVersion, toVersion) {
        throw new Error('Abstract method');
    }

    /**
     * Get the current version
     * @return {number}
     */
    getCurrentVersion() {
        throw new Error('Abstract method');
    }

    /**
     * Get the state associated with a given version
     * @param version
     * @returns {Object}
     */
    getState(version) {
        throw new Error('Abstract method');
    }
}

/**
 * A Topic Tracker tracks a given topic
 */
class TopicTracker {
    constructor(topic) {
        this._topic = topic;
        this._pendingQueries = [];
    }

    /**
     * Return the topic associated with this topic tracker
     * @returns {BasicTopic}
     */
    getTopic() {
        return this._topic;
    }

    /**
     * Return pending queries for this topic
     */
    getPendingQueries() {
        return this._pendingQueries;
    }

    /**
     * Remove pending queries that is containted in pendingQueries
     * @param {Set.<PendingQuery>} pendingQueries 
     */
    removePendingQuerys(pendingQueries) {
        this._pendingQueries = _.reject(
            this._pendingQueries, 
            pendingQuery => pendingQueries.has(pendingQuery),
        );
    }

    /**
     * Add a pending query to this topic tracker
     * @param {PendingQuery} pendingQuery 
     */
    addPendingQuery(pendingQuery) {
        this._pendingQueries.push(pendingQuery);
    }
}

export class TopicManager {
    constructor() {
        /** @member {Object.<string, TopicTracker>} _topicTracker */
        this._topicTrackers = {};
        this._topicFactories = [];
    }

    addTopicFactory(factory) {
        this._topicFactories.push(factory);
    }

    async _getTopicTracker(topicId) {
        let topicTracker = this._topicTrackers[topicId];
        if (topicTracker) {
            return topicTracker;
        }

        let topic = null;
        for (let i = 0; i < this._topicFactories.length; i ++) {
            const topicFactory = this._topicFactories[i];
            topic = await topicFactory(topicId);
            if (topic) {
                break;
            }
        }

        if (topic === null) {
            throw new Error(`topic ${topicId} does not exist`);
        }

        topicTracker = new TopicTracker(topic);
        this._topicTrackers[topicId] = topicTracker;
        return topicTracker;
    }

    /**
     * Apply change to a topic
     * All pending query associated with this topic will be compeletd
     * @param {string} topicId 
     * @param {string} action 
     * @param {string} subAction 
     * @param {Object} payload 
     */
    async applyChange(topicId, action, subAction, payload) {
        const topicTracker = await this._getTopicTracker(topicId);
        const topic = topicTracker.getTopic();

        topic.applyChange(action, subAction, payload);
        // this topic's version should be updated by now

        const topicIds = new Set();
        _.forEach(topicTracker.getPendingQueries(), (pendingQuery) => {
            addToSet(topicIds, _.keys(pendingQuery.getQuery()));
        });

        const pendingQueries = _.clone(topicTracker.getPendingQueries());
        _.forEach(topicIds, (topicId) => {
            const topicTracker = this.topicTracker[topicId];
            topicTracker.removePendingQuerys(pendingQueries);
        });

        _.forEach(pendingQueries, (pendingQuery) => {
            this._completePendingQuery(pendingQuery);
        });
    }

    /**
     * Perform a query, return a promise, the promise will be resolved if 
     * the query is mature
     * @param {Object.<string, number>} queryRequest // key: topicId, value: version
     * @param {number} timeoutInMS
     */
    async query({query, timeoutInMS}) {
        for (let topicId in query) {
            await this._getTopicTracker(topicId);
        }
        // pass here, all topics in the query are valid

        const pendingQuery = new PendingQuery({query, timeoutInMS});
        if (this._isQueryRequestMature(pendingQuery)) {
            this._completePendingQuery(pendingQuery);
        } else {
            _.forEach(query, (version, topicId) => {
                const topicTracker = this._topicTrackers[topicId];
                topicTracker.addPendingQuery(pendingQuery);
            });
            setTimeout(() => {
                this._completePendingQuery(pendingQuery);
            }, timeoutInMS);
        }
        return pendingQuery.getResult();
    }

    _isQueryRequestMature(pendingQuery) {
        if (pendingQuery.isTimeout()) {
            return true;
        }

        return _.find(pendingQuery.getQuery(), (version, topicId) => {
            const topic = this._topicTrackers[topicId].getTopic();
            return version < topic.getCurrentVersion();
        });
    }

    _completePendingQuery(pendingQuery) {
        const queryResponse = new QueryResponse();

        _.forEach(pendingQuery.getQuery(), (version, topicId) => {
            const topicTracker = this._topicTrackers[topicId];
            const topic = topicTracker.getTopic();
            const currentVersion = topic.getCurrentVersion();
            if (currentVersion < version) {
                throw new Error(
                    `Client version ${version} is exceeding server version ${currentVersion} for topic ${topicId}`
                );
            }
            if (currentVersion > version) {
                const changes = topic.getChanges(version, currentVersion);
                let state = null;
                if (changes === null) {
                    state = topic.getState(currentVersion);
                }
                queryResponse.setTopic(topicId, {version: currentVersion, state, changes});
            }
        });

        pendingQuery.resolve(queryResponse);
    }
}

class QueryBuilder {
    constructor(target) {
        this._items = [];
        this._target = target;
    }

    topic(key, value = -1) {
        this._items.push({key, value});
        return this;
    }

    build() {
        const result = this._target ? this._target : {};
        this._items.forEach(({key, value}) => {
            result[key] = value;
        });
        return result;
    }
}

export function queryBuilder(target = null) {
    return new QueryBuilder(target);
}

class QueryResponse {
    constructor() {
        this.topics = {}; // key: topicId, value: {changes: ..., state: ..., version: ...}
    }

    setTopic(topicId, {version, state, changes}) {
        this.topics[topicId] = {version, state, changes};
    }
}

class PendingQuery {
    constructor({query, timeoutInMS}) {
        this._query = query;  // key: topicId, value: version
        this._timeoutInMS = timeoutInMS;
        this._timeStartedMS = Date.now();
        this._result = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
        this._settled = false;
    }

    isTimeout() {
        return ((Date.now() - this._timeStartedMS) >= this._timeoutInMS);
    }


    getResult() {
        return this._result; 
    }

    check() {

    }

    resolve(queryResponse) {
        if (this._settled) {
            return;
        }
        this._settled = true;
        this._resolve(queryResponse);
    }

    getQuery() {
        return this._query;
    }
}