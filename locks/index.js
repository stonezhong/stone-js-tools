export function ensure(expr, message) {
    if (!expr) {
        throw new Error(message);
    }
}

export class Lock {
    constructor() {
        this._ownerId = null;
        this._lockCount = 0;
        this._signal = null;
        this._triggerSignal = null;
    }

    unlock(ownerId) {
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

    async lock(ownerId) {
        ensure(ownerId !== null, 'ownerId must not be null');

        for (;;) {
            if (this._ownerId === null) {
                this._lockCount = 1;
                this._ownerId = ownerId;
                return;
            }

            if (this._ownerId === ownerId) {
                ensure(this._lockCount > 0, 'lock with owner must have a positive lock count');
                this._lockCount ++;
                return;
            }

            if (this._signal === null) {
                this._signal = new Promise((resolve, reject) => {
                    this._triggerSignal = resolve;
                });
            }

            await this._signal;
        }
    }
}

export class Semaphore {
    constructor({initValue} = { }) {
        this._v = initValue || 0;
        this._signals = [];
    }

    up(count = 1) {
        ensure(count > 0, 'count must be positive');
        this._v += count;
        this._signals.forEach((signal) => { signal.resolve(); });
        this._signals = [];
        return this._v;
    }

    async down(count = 1) {
        ensure(count > 0, 'count must be positive');
        for (;;) {
            if (this._v >= count) {
                this._v -= count;
                return this._v;
            }

            const signal = {};
            signal.v = new Promise((resolve, reject) => {
                signal.resolve = resolve;
                signal.reject = reject;
            });
            
            this._signals.push(signal);
            await signal.v;
        }
    }
}

export class Queue {
    constructor() {
        this._q = [];
        this._semaphore = new Semaphore();
        this._lock = new Lock();
    }

    async push(item, ownerId) {
        await this._lock.lock(ownerId);
        this._q.push(item);
        this._semaphore.up();
        this._lock.unlock(ownerId);
    }

    async shift(ownerId) {
        let item = null;
        await this._semaphore.down();
        await this._lock.lock(ownerId);
        if (this._q.length === 0) {
            throw new Error('queue should not be empty');
        }
        item = this._q.shift();
        this._lock.unlock(ownerId);
        return item;
    }
}
