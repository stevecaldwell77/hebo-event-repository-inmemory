const assert = require('assert');
const curry = require('lodash/curry');
const isArray = require('lodash/isArray');
const autoBind = require('auto-bind');
const uniq = require('lodash/uniq');
const { validateEvent } = require('hebo/validators');

const versionFilter = curry(
    (greaterThan, event) => event.version > greaterThan,
);

const last = arr => arr.slice(-1)[0];

const eventCanBeAppended = (prevEvents, event) => {
    const lastEvent = last(prevEvents);
    const lastVersion = lastEvent ? lastEvent.version : 0;
    const newVersion = event.version;
    return newVersion > lastVersion;
};

class EventRepositoryInmemory {
    constructor({ aggregates } = {}) {
        assert(aggregates, 'EventRepositoryInmemory: aggregates required');
        assert(
            isArray(aggregates),
            'EventRepositoryInmemory: aggregates must be an array',
        );
        this.aggregates = uniq(aggregates).reduce(
            (accum, aggregate) => ({ ...accum, [aggregate]: {} }),
            {},
        );
        autoBind(this);
    }

    assertValidAggregate(label, aggregateName) {
        assert(
            this.aggregates[aggregateName],
            `event respository: ${label}: unknown aggregate "${aggregateName}"`,
        );
    }

    // eslint-disable-next-line require-await
    async getEvents(aggregateName, aggregateId, greaterThanVersion = 0) {
        this.assertValidAggregate('getEvents', aggregateName);
        const allEvents = this.aggregates[aggregateName][aggregateId] || [];
        return allEvents.filter(versionFilter(greaterThanVersion));
    }

    async appendEvent(aggregateName, aggregateId, event) {
        const prevEvents = await this.getEvents(aggregateName, aggregateId);
        const appendOk = eventCanBeAppended(prevEvents, event);
        if (!appendOk) return false;
        this.aggregates[aggregateName][aggregateId] = [...prevEvents, event];
        return true;
    }

    // eslint-disable-next-line require-await
    async writeEvent(aggregateName, aggregateId, event) {
        this.assertValidAggregate('writeEvent', aggregateName);
        validateEvent(event);
        return this.appendEvent(aggregateName, aggregateId, event);
    }

    // eslint-disable-next-line require-await
    async forceWriteEvent(aggregateName, aggregateId, event) {
        return this.appendEvent(aggregateName, aggregateId, event);
    }
}

module.exports = EventRepositoryInmemory;
