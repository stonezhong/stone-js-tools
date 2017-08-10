import _ from 'lodash';

import {
    BasicTopic,
    TopicManager,
} from './topic-manager/index';

export {
    BasicTopic,
    TopicManager,
};


export function greet() {
    _.forEach([1,2,3], (i) => { console.log(i); });
}
