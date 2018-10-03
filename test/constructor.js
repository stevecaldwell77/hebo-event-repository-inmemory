const test = require('ava');
const EventRepositoryInmemory = require('..');

test('constructor - aggregates is required', t => {
    t.throws(
        () => new EventRepositoryInmemory(),
        /aggregates required/,
        'aggregates required',
    );

    t.throws(
        () => new EventRepositoryInmemory({ aggregates: null }),
        /aggregates required/,
        'aggregates cannot be null',
    );

    t.throws(
        () => new EventRepositoryInmemory({ aggregates: undefined }),
        /aggregates required/,
        'aggregates cannot be undefined',
    );
});

test('constructor - aggregates must be array', t => {
    t.throws(
        () => new EventRepositoryInmemory({ aggregates: { foo: {} } }),
        /aggregates must be an array/,
        'aggregates cannot be an object',
    );
});
