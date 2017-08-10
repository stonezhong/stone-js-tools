# Tools to implement push notification

* TopicManager manages many topics
* Topic
    * getTopicId() returns topic id, and it must be unique within a topic manager.
    * A topic is an instance of class derived from BasicTopic
    * A topic has a version (number), when a topic is updated, the version will increment
    * version always >= 0, usually start from 0
    * version never decrement
    * A topic may be able to track changes (optional)
    * When a topic is registered with a topicManager, it will have a unique topicId
* TopicManager
    * You can register bunch of topic factories that can help to create topic based on topic id
    * call query to query multiple topics, the query will return if it is mature.
    * A query becomes mature if
        * A) The query is timed out
        * B) At least one topic the query is interested has a higher version
    * If a topic support change history, it may be able to transfter less data to client in query API to reduce the traffic



