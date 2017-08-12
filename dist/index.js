(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.stoneJsTools = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sleep = exports.Lock = exports.queryBuilder = exports.BasicTopic = exports.TopicManager = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _index = require('./topic-manager/index');

var _index2 = require('./locks/index');

var _index3 = require('./utils/index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.TopicManager = _index.TopicManager;
exports.BasicTopic = _index.BasicTopic;
exports.queryBuilder = _index.queryBuilder;
exports.Lock = _index2.Lock;
exports.sleep = _index3.sleep;

},{"./locks/index":2,"./topic-manager/index":3,"./utils/index":4,"lodash":"lodash"}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.ensure = ensure;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ensure(expr, message) {
    if (!expr) {
        throw new Error(message);
    }
}

var Lock = exports.Lock = function () {
    function Lock() {
        _classCallCheck(this, Lock);

        this._ownerId = null;
        this._lockCount = 0;
        this._signal = null;
        this._triggerSignal = null;
    }

    _createClass(Lock, [{
        key: 'unlock',
        value: function unlock(ownerId) {
            ensure(ownerId !== null, 'ownerId must not be null');
            ensure(this._ownerId !== null, 'only lock with owner can be unlocked');
            ensure(this._lockCount > 0, 'lock with owner must have a positive lock count');
            this._lockCount -= 1;
            if (this._lockCount === 0) {
                this._ownerId = null;
                // if _signal is null, mean there is no one blocked on lock
                if (this._signal !== null) {
                    this._signal = null;
                    this._triggerSignal();
                }
            }
        }
    }, {
        key: 'lock',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ownerId) {
                var _this = this;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                ensure(ownerId !== null, 'ownerId must not be null');

                            case 1:
                                if (!(this._ownerId === null)) {
                                    _context.next = 5;
                                    break;
                                }

                                this._lockCount = 1;
                                this._ownerId = ownerId;
                                return _context.abrupt('return');

                            case 5:
                                if (!(this._ownerId === ownerId)) {
                                    _context.next = 9;
                                    break;
                                }

                                ensure(this._lockCount > 0, 'lock with owner must have a positive lock count');
                                this._lockCount++;
                                return _context.abrupt('return');

                            case 9:

                                if (this._signal === null) {
                                    this._signal = new Promise(function (resolve, reject) {
                                        _this._triggerSignal = resolve;
                                    });
                                }

                                _context.next = 12;
                                return this._signal;

                            case 12:
                                _context.next = 1;
                                break;

                            case 14:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function lock(_x) {
                return _ref.apply(this, arguments);
            }

            return lock;
        }()
    }]);

    return Lock;
}();

var Semaphore = exports.Semaphore = function () {
    function Semaphore() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            initValue = _ref2.initValue;

        _classCallCheck(this, Semaphore);

        this._v = initValue || 0;
        this._signals = [];
    }

    _createClass(Semaphore, [{
        key: 'up',
        value: function up() {
            var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

            ensure(count > 0, 'count must be positive');
            this._v += count;
            this._signals.forEach(function (signal) {
                signal.resolve();
            });
            this._signals = [];
            return this._v;
        }
    }, {
        key: 'down',
        value: function () {
            var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
                var _this2 = this;

                var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

                var _loop, _ret;

                return regeneratorRuntime.wrap(function _callee2$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                ensure(count > 0, 'count must be positive');
                                _loop = regeneratorRuntime.mark(function _loop() {
                                    var signal;
                                    return regeneratorRuntime.wrap(function _loop$(_context2) {
                                        while (1) {
                                            switch (_context2.prev = _context2.next) {
                                                case 0:
                                                    if (!(_this2._v >= count)) {
                                                        _context2.next = 3;
                                                        break;
                                                    }

                                                    _this2._v -= count;
                                                    return _context2.abrupt('return', {
                                                        v: _this2._v
                                                    });

                                                case 3:
                                                    signal = {};

                                                    signal.v = new Promise(function (resolve, reject) {
                                                        signal.resolve = resolve;
                                                        signal.reject = reject;
                                                    });

                                                    _this2._signals.push(signal);
                                                    _context2.next = 8;
                                                    return signal.v;

                                                case 8:
                                                case 'end':
                                                    return _context2.stop();
                                            }
                                        }
                                    }, _loop, _this2);
                                });

                            case 2:
                                return _context3.delegateYield(_loop(), 't0', 3);

                            case 3:
                                _ret = _context3.t0;

                                if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
                                    _context3.next = 6;
                                    break;
                                }

                                return _context3.abrupt('return', _ret.v);

                            case 6:
                                _context3.next = 2;
                                break;

                            case 8:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function down() {
                return _ref3.apply(this, arguments);
            }

            return down;
        }()
    }]);

    return Semaphore;
}();

var Queue = exports.Queue = function () {
    function Queue() {
        _classCallCheck(this, Queue);

        this._q = [];
        this._semaphore = new Semaphore();
        this._lock = new Lock();
    }

    _createClass(Queue, [{
        key: 'push',
        value: function () {
            var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(item, ownerId) {
                return regeneratorRuntime.wrap(function _callee3$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return this._lock.lock(ownerId);

                            case 2:
                                this._q.push(item);
                                this._semaphore.up();
                                this._lock.unlock(ownerId);

                            case 5:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function push(_x5, _x6) {
                return _ref4.apply(this, arguments);
            }

            return push;
        }()
    }, {
        key: 'shift',
        value: function () {
            var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(ownerId) {
                var item;
                return regeneratorRuntime.wrap(function _callee4$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                item = null;
                                _context5.next = 3;
                                return this._semaphore.down();

                            case 3:
                                _context5.next = 5;
                                return this._lock.lock(ownerId);

                            case 5:
                                if (!(this._q.length === 0)) {
                                    _context5.next = 7;
                                    break;
                                }

                                throw new Error('queue should not be empty');

                            case 7:
                                item = this._q.shift();
                                this._lock.unlock(ownerId);
                                return _context5.abrupt('return', item);

                            case 10:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function shift(_x7) {
                return _ref5.apply(this, arguments);
            }

            return shift;
        }()
    }]);

    return Queue;
}();

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TopicManager = exports.BasicTopic = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.queryBuilder = queryBuilder;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function addToSet(target, source) {
    _lodash2.default.forEach(source, function (element) {
        target.add(element);
    });
}

var BasicTopic = exports.BasicTopic = function () {
    function BasicTopic() {
        _classCallCheck(this, BasicTopic);
    }

    _createClass(BasicTopic, [{
        key: 'getTopicId',

        /**
         * @return {string} A unique topic id
         */
        value: function getTopicId() {}

        /**
         * Apply change to a topic
         * Derived class need to implement this method
         * @abstract
         * @param {string} action
         * @param {string} subAction
         * @param {Object} payload
         */

    }, {
        key: 'applyChange',
        value: function applyChange(action, subAction, payload) {
            throw new Error('Abstract method');
        }

        /**
         * Get changes between fromVersion and toVersion
         * return null if this topic does not support getting changes
         * @param {number} fromVersion
         * @param {number} toVersion
         * @return {Array}
         */

    }, {
        key: 'getChanges',
        value: function getChanges(fromVersion, toVersion) {
            throw new Error('Abstract method');
        }

        /**
         * Get the current version
         * @return {number}
         */

    }, {
        key: 'getCurrentVersion',
        value: function getCurrentVersion() {
            throw new Error('Abstract method');
        }

        /**
         * Get the state associated with a given version
         * @param version
         * @returns {Object}
         */

    }, {
        key: 'getState',
        value: function getState(version) {
            throw new Error('Abstract method');
        }
    }]);

    return BasicTopic;
}();

/**
 * A Topic Tracker tracks a given topic
 */


var TopicTracker = function () {
    function TopicTracker(topic) {
        _classCallCheck(this, TopicTracker);

        this._topic = topic;
        this._pendingQueries = [];
    }

    /**
     * Return the topic associated with this topic tracker
     * @returns {BasicTopic}
     */


    _createClass(TopicTracker, [{
        key: 'getTopic',
        value: function getTopic() {
            return this._topic;
        }

        /**
         * Return pending queries for this topic
         */

    }, {
        key: 'getPendingQueries',
        value: function getPendingQueries() {
            return this._pendingQueries;
        }

        /**
         * Remove pending queries that is containted in pendingQueries
         * @param {Set.<PendingQuery>} pendingQueries 
         */

    }, {
        key: 'removePendingQuerys',
        value: function removePendingQuerys(pendingQueries) {
            this._pendingQueries = _lodash2.default.reject(this._pendingQueries, function (pendingQuery) {
                return pendingQueries.has(pendingQuery);
            });
        }

        /**
         * Add a pending query to this topic tracker
         * @param {PendingQuery} pendingQuery 
         */

    }, {
        key: 'addPendingQuery',
        value: function addPendingQuery(pendingQuery) {
            this._pendingQueries.push(pendingQuery);
        }
    }]);

    return TopicTracker;
}();

var TopicManager = function () {
    function TopicManager() {
        _classCallCheck(this, TopicManager);

        /** @member {Object.<string, TopicTracker>} _topicTracker */
        this._topicTrackers = {};
        this._topicFactories = [];
    }

    _createClass(TopicManager, [{
        key: 'addTopicFactory',
        value: function addTopicFactory(factory) {
            this._topicFactories.push(factory);
        }
    }, {
        key: '_getTopicTracker',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(topicId) {
                var topicTracker, topic, i, topicFactory;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                topicTracker = this._topicTrackers[topicId];

                                if (!topicTracker) {
                                    _context.next = 3;
                                    break;
                                }

                                return _context.abrupt('return', topicTracker);

                            case 3:
                                topic = null;
                                i = 0;

                            case 5:
                                if (!(i < this._topicFactories.length)) {
                                    _context.next = 15;
                                    break;
                                }

                                topicFactory = this._topicFactories[i];
                                _context.next = 9;
                                return topicFactory(topicId);

                            case 9:
                                topic = _context.sent;

                                if (!topic) {
                                    _context.next = 12;
                                    break;
                                }

                                return _context.abrupt('break', 15);

                            case 12:
                                i++;
                                _context.next = 5;
                                break;

                            case 15:
                                if (!(topic === null)) {
                                    _context.next = 17;
                                    break;
                                }

                                throw new Error('topic ' + topicId + ' does not exist');

                            case 17:

                                topicTracker = new TopicTracker(topic);
                                this._topicTrackers[topicId] = topicTracker;
                                return _context.abrupt('return', topicTracker);

                            case 20:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function _getTopicTracker(_x) {
                return _ref.apply(this, arguments);
            }

            return _getTopicTracker;
        }()

        /**
         * Apply change to a topic
         * All pending query associated with this topic will be compeletd
         * @param {string} topicId 
         * @param {string} action 
         * @param {string} subAction 
         * @param {Object} payload 
         */

    }, {
        key: 'applyChange',
        value: function () {
            var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(topicId, action, subAction, payload) {
                var _this = this;

                var topicTracker, topic, topicIds, pendingQueries;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this._getTopicTracker(topicId);

                            case 2:
                                topicTracker = _context2.sent;
                                topic = topicTracker.getTopic();


                                topic.applyChange(action, subAction, payload);
                                // this topic's version should be updated by now

                                topicIds = new Set();

                                _lodash2.default.forEach(topicTracker.getPendingQueries(), function (pendingQuery) {
                                    addToSet(topicIds, _lodash2.default.keys(pendingQuery.getQuery()));
                                });

                                pendingQueries = _lodash2.default.clone(topicTracker.getPendingQueries());

                                _lodash2.default.forEach(topicIds, function (topicId) {
                                    var topicTracker = _this.topicTracker[topicId];
                                    topicTracker.removePendingQuerys(pendingQueries);
                                });

                                _lodash2.default.forEach(pendingQueries, function (pendingQuery) {
                                    _this._completePendingQuery(pendingQuery);
                                });

                            case 10:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function applyChange(_x2, _x3, _x4, _x5) {
                return _ref2.apply(this, arguments);
            }

            return applyChange;
        }()

        /**
         * Perform a query, return a promise, the promise will be resolved if 
         * the query is mature
         * @param {Object.<string, number>} queryRequest // key: topicId, value: version
         * @param {number} timeoutInMS
         */

    }, {
        key: 'query',
        value: function () {
            var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(_ref4) {
                var _this2 = this;

                var _query = _ref4.query,
                    timeoutInMS = _ref4.timeoutInMS;
                var topicId, pendingQuery;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.t0 = regeneratorRuntime.keys(_query);

                            case 1:
                                if ((_context3.t1 = _context3.t0()).done) {
                                    _context3.next = 7;
                                    break;
                                }

                                topicId = _context3.t1.value;
                                _context3.next = 5;
                                return this._getTopicTracker(topicId);

                            case 5:
                                _context3.next = 1;
                                break;

                            case 7:
                                // pass here, all topics in the query are valid

                                pendingQuery = new PendingQuery({ query: _query, timeoutInMS: timeoutInMS });

                                if (this._isQueryRequestMature(pendingQuery)) {
                                    this._completePendingQuery(pendingQuery);
                                } else {
                                    _lodash2.default.forEach(_query, function (version, topicId) {
                                        var topicTracker = _this2._topicTrackers[topicId];
                                        topicTracker.addPendingQuery(pendingQuery);
                                    });
                                    setTimeout(function () {
                                        _this2._completePendingQuery(pendingQuery);
                                    }, timeoutInMS);
                                }
                                return _context3.abrupt('return', pendingQuery.getResult());

                            case 10:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function query(_x6) {
                return _ref3.apply(this, arguments);
            }

            return query;
        }()
    }, {
        key: '_isQueryRequestMature',
        value: function _isQueryRequestMature(pendingQuery) {
            var _this3 = this;

            if (pendingQuery.isTimeout()) {
                return true;
            }

            return _lodash2.default.find(pendingQuery.getQuery(), function (version, topicId) {
                var topic = _this3._topicTrackers[topicId].getTopic();
                return version < topic.getCurrentVersion();
            });
        }
    }, {
        key: '_completePendingQuery',
        value: function _completePendingQuery(pendingQuery) {
            var _this4 = this;

            var queryResponse = new QueryResponse();

            _lodash2.default.forEach(pendingQuery.getQuery(), function (version, topicId) {
                var topicTracker = _this4._topicTrackers[topicId];
                var topic = topicTracker.getTopic();
                var currentVersion = topic.getCurrentVersion();
                if (currentVersion < version) {
                    throw new Error('Client version ' + version + ' is exceeding server version ' + currentVersion + ' for topic ' + topicId);
                }
                if (currentVersion > version) {
                    var changes = topic.getChanges(version, currentVersion);
                    var state = null;
                    if (changes === null) {
                        state = topic.getState(currentVersion);
                    }
                    queryResponse.setTopic(topicId, { version: currentVersion, state: state, changes: changes });
                }
            });

            pendingQuery.resolve(queryResponse);
        }
    }]);

    return TopicManager;
}();

exports.TopicManager = TopicManager;

var QueryBuilder = function () {
    function QueryBuilder(target) {
        _classCallCheck(this, QueryBuilder);

        this._items = [];
        this._target = target;
    }

    _createClass(QueryBuilder, [{
        key: 'topic',
        value: function topic(key) {
            var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

            this._items.push({ key: key, value: value });
            return this;
        }
    }, {
        key: 'build',
        value: function build() {
            var result = this._target ? this._target : {};
            this._items.forEach(function (_ref5) {
                var key = _ref5.key,
                    value = _ref5.value;

                result[key] = value;
            });
            return result;
        }
    }]);

    return QueryBuilder;
}();

function queryBuilder() {
    var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    return new QueryBuilder(target);
}

var QueryResponse = function () {
    function QueryResponse() {
        _classCallCheck(this, QueryResponse);

        this.topics = {}; // key: topicId, value: {changes: ..., state: ..., version: ...}
    }

    _createClass(QueryResponse, [{
        key: 'setTopic',
        value: function setTopic(topicId, _ref6) {
            var version = _ref6.version,
                state = _ref6.state,
                changes = _ref6.changes;

            this.topics[topicId] = { version: version, state: state, changes: changes };
        }
    }]);

    return QueryResponse;
}();

var PendingQuery = function () {
    function PendingQuery(_ref7) {
        var _this5 = this;

        var query = _ref7.query,
            timeoutInMS = _ref7.timeoutInMS;

        _classCallCheck(this, PendingQuery);

        this._query = query; // key: topicId, value: version
        this._timeoutInMS = timeoutInMS;
        this._timeStartedMS = Date.now();
        this._result = new Promise(function (resolve, reject) {
            _this5._resolve = resolve;
            _this5._reject = reject;
        });
        this._settled = false;
    }

    _createClass(PendingQuery, [{
        key: 'isTimeout',
        value: function isTimeout() {
            return Date.now() - this._timeStartedMS >= this._timeoutInMS;
        }
    }, {
        key: 'getResult',
        value: function getResult() {
            return this._result;
        }
    }, {
        key: 'check',
        value: function check() {}
    }, {
        key: 'resolve',
        value: function resolve(queryResponse) {
            if (this._settled) {
                return;
            }
            this._settled = true;
            this._resolve(queryResponse);
        }
    }, {
        key: 'getQuery',
        value: function getQuery() {
            return this._query;
        }
    }]);

    return PendingQuery;
}();

},{"lodash":"lodash"}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sleep = sleep;
function sleep(duration) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, duration);
    });
}

},{}]},{},[1])(1)
});