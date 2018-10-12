const assert = require('assert');
const curry = require('lodash/curry');
const isArray = require('lodash/isArray');
const autoBind = require('auto-bind');
const uniq = require('lodash/uniq');
const { validateEvent } = require('hebo-validation');

const sequenceNumberFilter = curry(
    (greaterThan, event) => event.sequenceNumber > greaterThan,
);

const last = arr => arr.slice(-1)[0];

const eventCanBeAppended = (prevEvents, event) => {
    const lastEvent = last(prevEvents);
    const lastsequenceNumber = lastEvent ? lastEvent.sequenceNumber : 0;
    const newsequenceNumber = event.sequenceNumber;
    return newsequenceNumber > lastsequenceNumber;
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
    async getEvents(aggregateName, aggregateId, greaterThanSequenceNumber = 0) {
        this.assertValidAggregate('getEvents', aggregateName);
        const allEvents = this.aggregates[aggregateName][aggregateId] || [];
        return allEvents.filter(
            sequenceNumberFilter(greaterThanSequenceNumber),
        );
    }

    async appendEvent(event) {
        const { aggregateName, aggregateId } = event;
        const prevEvents = await this.getEvents(aggregateName, aggregateId);
        const appendOk = eventCanBeAppended(prevEvents, event);
        if (!appendOk) return false;
        this.aggregates[aggregateName][aggregateId] = [...prevEvents, event];
        return true;
    }

    // eslint-disable-next-line require-await
    async writeEvent(event) {
        this.assertValidAggregate('writeEvent', event.aggregateName);
        validateEvent(event);
        return this.appendEvent(event);
    }

    // eslint-disable-next-line require-await
    async forceWriteEvent(event) {
        return this.appendEvent(event);
    }
}

module.exports = EventRepositoryInmemory;
