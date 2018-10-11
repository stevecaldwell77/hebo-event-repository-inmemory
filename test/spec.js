const test = require('ava');
const shortid = require('shortid');
const {
    validateEventRepository,
    InvalidEventError,
} = require('hebo-validation');
const EventRepositoryInmemory = require('..');

const makeRepo = () => new EventRepositoryInmemory({ aggregates: ['book'] });

const makeSetAuthorEvent = ({ sequenceNumber }) => ({
    eventId: shortid.generate(),
    type: 'AUTHOR_SET',
    metadata: { userId: 1234 },
    payload: { author: 'Fitzgerald' },
    sequenceNumber,
});

const makeSetTitleEvent = ({ sequenceNumber }) => ({
    eventId: shortid.generate(),
    type: 'TITLE_SET',
    metadata: { userId: 1234 },
    payload: { title: 'The Great Gatsby' },
    sequenceNumber,
});

const makeSetPublisherEvent = ({ sequenceNumber }) => ({
    eventId: shortid.generate(),
    type: 'PUBLISHER_SET',
    metadata: { userId: 1234 },
    payload: { publisherId: shortid.generate() },
    sequenceNumber,
});

test('passes validator', t => {
    const repo = makeRepo();
    const { error } = validateEventRepository(repo);
    t.is(error, null, 'no error generaged by validation');
});

test('writeEvent() - valid event is written', async t => {
    const repo = makeRepo();
    const bookId = shortid.generate();

    const event1 = makeSetAuthorEvent({ sequenceNumber: 1 });
    const event2 = makeSetTitleEvent({ sequenceNumber: 2 });

    const result1 = await repo.writeEvent('book', bookId, event1);
    t.true(result1, 'writeEvent() returns true with valid event');

    const result2 = await repo.writeEvent('book', bookId, event2);
    t.true(result2, 'writeEvent() returns true with second valid event');

    t.deepEqual(
        await repo.getEvents('book', bookId),
        [event1, event2],
        'events written by writeEvent() succesfully stored',
    );
});

test('writeEvent() - invalid event throws an error', async t => {
    const repo = makeRepo();
    const bookId = shortid.generate();

    // event missing type
    await t.throws(
        repo.writeEvent('book', bookId, {
            eventId: shortid.generate(),
            metadata: {},
            payload: {},
            sequenceNumber: 1,
        }),
        InvalidEventError,
        'an invalid event throws an InvalidEventError',
    );

    t.deepEqual(
        await repo.getEvents('book', bookId),
        [],
        'invalid event is not stored',
    );
});

test('writeEvent() - stale sequenceNumber returns false', async t => {
    const repo = makeRepo();
    const bookId = shortid.generate();

    const event1 = makeSetAuthorEvent({ sequenceNumber: 1 });
    const event2 = makeSetTitleEvent({ sequenceNumber: 1 });

    await repo.writeEvent('book', bookId, event1);

    const result2 = await repo.writeEvent('book', bookId, event2);
    t.false(
        result2,
        'writeEvent() returns false for event with stale sequenceNumber',
    );

    t.deepEqual(
        await repo.getEvents('book', bookId),
        [event1],
        'event with stale sequenceNumber not stored',
    );
});

test('getEvents() - no minimum sequenceNumber', async t => {
    const repo = makeRepo();
    const bookId = shortid.generate();

    t.deepEqual(
        await repo.getEvents('book', bookId),
        [],
        'getEvents() can be called on empty store',
    );

    const event1 = makeSetAuthorEvent({ sequenceNumber: 1 });
    const event2 = makeSetTitleEvent({ sequenceNumber: 2 });
    const event3 = makeSetPublisherEvent({ sequenceNumber: 3 });

    await repo.writeEvent('book', bookId, event1);
    await repo.writeEvent('book', bookId, event2);
    await repo.writeEvent('book', bookId, event3);

    t.deepEqual(
        await repo.getEvents('book', bookId),
        [event1, event2, event3],
        'getEvents() with no minimum sequenceNumber returns all events',
    );
});

test('getEvents() - minimum sequenceNumber', async t => {
    const repo = makeRepo();
    const bookId = shortid.generate();

    const event1 = makeSetAuthorEvent({ sequenceNumber: 1 });
    const event2 = makeSetTitleEvent({ sequenceNumber: 2 });
    const event3 = makeSetPublisherEvent({ sequenceNumber: 3 });

    await repo.writeEvent('book', bookId, event1);
    await repo.writeEvent('book', bookId, event2);
    await repo.writeEvent('book', bookId, event3);

    t.deepEqual(
        await repo.getEvents('book', bookId, 2),
        [event3],
        'getEvents() respects minimum sequenceNumber',
    );

    t.deepEqual(
        await repo.getEvents('book', bookId, 4),
        [],
        'getEvents() respects minimum sequenceNumber larger than last event',
    );
});
