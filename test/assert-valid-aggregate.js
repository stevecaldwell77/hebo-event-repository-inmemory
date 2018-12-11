const test = require('ava');
const shortid = require('shortid');
const uuid = require('uuid/v4');
const EventRepositoryInmemory = require('..');

test('writeEvent() - aggregate must be defined in constructor', async t => {
    const repo = new EventRepositoryInmemory({
        aggregates: ['book', 'author'],
    });
    const { writeEvent } = repo;

    // Bit of a cheat, an event that works for both aggregates
    const makeEvent = aggregateName => ({
        aggregateName,
        aggregateId: shortid.generate(),
        eventId: uuid(),
        type: 'NAME_SET',
        metadata: { userId: 1234 },
        payload: { name: 'Johnson' },
        sequenceNumber: 1,
    });

    await t.notThrows(
        writeEvent(makeEvent('book')),
        'able to call writeEvent to first aggregate',
    );

    await t.notThrows(
        writeEvent(makeEvent('author')),
        'able to call writeEvent to second aggregate',
    );

    await t.throws(
        writeEvent(makeEvent('publisher')),
        /unknown aggregate "publisher"/,
        'error thrown when writeEvent called with unknown aggregate',
    );
});

test('getEvents() - aggregate must be defined in constructor', async t => {
    const repo = new EventRepositoryInmemory({
        aggregates: ['book', 'author'],
    });
    const { getEvents } = repo;

    await t.notThrows(
        getEvents('book', shortid.generate()),
        'able to call getEvents to first aggregate',
    );

    await t.notThrows(
        getEvents('author', shortid.generate()),
        'able to call getEvents to second aggregate',
    );

    await t.throws(
        getEvents('publisher', shortid.generate()),
        /unknown aggregate "publisher"/,
        'error thrown when getEvents called with unknown aggregate',
    );
});
