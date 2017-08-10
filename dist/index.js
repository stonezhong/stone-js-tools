(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.stoneJsTools = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.queryBuilder = exports.BasicTopic = exports.TopicManager = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _index = require('./topic-manager/index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.TopicManager = _index.TopicManager;
exports.BasicTopic = _index.BasicTopic;
exports.queryBuilder = _index.queryBuilder;

},{"./topic-manager/index":2,"lodash":"lodash"}],2:[function(require,module,exports){
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

},{"lodash":"lodash"}]},{},[1])(1)
});