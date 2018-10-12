const test = require('ava');
const shortid = require('shortid');
const uuid = require('uuid/v4');
const EventRepositoryInmemory = require('..');

test('forceWriteEvent() - invalid event can be stored', async t => {
    const repo = new EventRepositoryInmemory({ aggregates: ['book'] });
    const bookId = shortid.generate();

    const event = {
        aggregateName: 'book',
        aggregateId: bookId,
        eventId: uuid(),
        metadata: {},
        payload: {},
        sequenceNumber: 1,
    };

    // event missing type
    const result = await repo.forceWriteEvent(event);
    t.true(result, 'forceWriteEvent() returns true');

    t.deepEqual(
        await repo.getEvents('book', bookId),
        [event],
        'invalid event is stored',
    );
});
