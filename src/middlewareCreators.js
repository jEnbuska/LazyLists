/* eslint-disable consistent-return */
const { NOT_SET, createSet, orderComparator, entriesToObject, } = require('./utils');

function first () {
  return function createFirst ({ resolve, retired, next, }) {
    let value = NOT_SET;
    retired = retired.concat(() => value === NOT_SET);
    return {
      retired,
      resolve: async function resolveFirst () {
        const output = value;
        value = NOT_SET;
        await next(output, []);
        await resolve();
      },
      next: function createFirst (val) {
        if (retired.call()) {
          value = val;
        }
      },
    };
  };
}

function default$ (defaultValue) {
  return function createDefault ({ next, resolve, retired, }) {
    let isSet = false;
    return {
      resolve: async function resolveDefault () {
        if (!isSet) {
          await next(defaultValue);
        } else {
          isSet = false;
        }
        await resolve();
      },
      next: function invokeDefault (val) {
        if (retired.call()) {
          isSet = true;
          return next(val);
        }
      },
    };
  };
}

function reverse () {
  return function createReverse ({ next, retired, resolve, }) {
    let futures = [];
    return {
      resolve: async function resolveReversed () {
        const runnables = futures.reverse();
        futures = [];
        // eslint-disable-next-line no-empty
        for (let i = 0; i < runnables.length && await runnables[i](); i++) {}
        await resolve();
      },
      next: function invokeReverse (val, order) {
        if (retired.call()) {
          futures.push(() => next(val, order));
          return true;
        }
      },
    };
  };
}

function sort (comparator) {
  return function createSort ({ next, retired, resolve, }) {
    let futures = [];
    return {
      resolve: async function resolveSort () {
        const runnables = futures.sort(function (a, b) {
          return comparator(a.val, b.val);
        });
        futures = [];
        // eslint-disable-next-line no-empty
        for (let i = 0; i < runnables.length && await runnables[i].task(); i++) {}
        return resolve();
      },
      next: function invokeReverse (val, order) {
        if (retired.call()) {
          futures.push({ val, task: () => next(val, order), });
          return true;
        }
      },
    };
  };
}

function peek (callback) {
  return function createPeek ({ retired, next, }) {
    return {
      next: function invokePeek (val, order) {
        if (retired.call()) {
          callback(val);
          return next(val, order);
        }
      },
    };
  };
}

function toArray () {
  return function createToArray ({ retired, next, resolve, }) {
    let acc = [];
    return {
      resolve: async function resolveToArray () {
        const result = acc;
        acc = [];
        await next(result);
        await resolve();
      },
      next: function invokeToArray (val) {
        if (retired.call()) {
          acc.push(val);
          return true;
        }
      },
    };
  };
}

function toSet (picker) {
  return function createToArray ({ retired, next, resolve, }) {
    let acc = new Set();
    return {
      resolve: async function resolveToSet () {
        let result = acc;
        acc = new Set();
        await next(result);
        await resolve();
      },
      next: function invokeToSet (val) {
        if (retired.call()) {
          acc.add(picker(val));
          return true;
        }
      },
    };
  };
}

function toObject (picker) {
  return function createToObject ({ retired, next, resolve, }) {
    let acc = {};
    return {
      resolve: async function resolveToObject () {
        const result = acc;
        acc = {};
        await next(result);
        await resolve();
      },
      next: function invokeToObject (val) {
        if (retired.call()) {
          acc[picker(val)] = val;
          return true;
        }
      },
    };
  };
}

function toObjectSet (picker) {
  return function createToArray ({ retired, next, resolve, }) {
    let acc = {};
    return {
      resolve: async function resolveToObjectSet () {
        let result = acc;
        acc = {};
        await next(result);
        await resolve();
      },
      next: function invokeToObjectSet (val) {
        if (retired.call()) {
          acc[picker(val)] = true;
          return true;
        }
      },
    };
  };
}
function toMap (picker) {
  return function createToMap ({ retired, next, resolve, }) {
    let acc = new Map();
    return {
      resolve: async function resolveToMap () {
        const result = acc;
        acc = new Map();
        await next(result);
        await resolve();
      },
      next: function invokeToObject (val) {
        if (retired.call()) {
          acc.set(picker(val), val);
          return true;
        }
      },
    };
  };
}

function ordered () {
  return function createOrdered ({ next, retired, resolve, }) {
    let futures = {};
    return {
      resolve: async function resolveOrdered () {
        const runnables = Object.entries(futures).sort((e1, e2) => orderComparator(e1[0], e2[0])).map((e) => e[1]);
        futures = {};
        // eslint-disable-next-line no-empty
        for (let i = 0; i < runnables.length && await runnables[i](); i++) {}
        await resolve();
      },
      next: function invokeOrdered (val, order) {
        if (retired.call()) {
          futures[order] = () => next(val, order);
          return true;
        }
      },
    };
  };
}

function flatten (iterator) {
  return function createFlatten ({ next, retired, }) {
    return {
      next: async function invokeFlatten (val, order) {
        if (retired.call()) {
          const iterable = iterator(val);
          for (let i = 0; i<iterable.length; i++) {
            const flattenResult = await next(iterable[i], [ ...order, i, ]);
            if (!flattenResult) {
              return false;
            }
          }
          return true;
        }
      },
    };
  };
}

function map (mapper) {
  return function createMap ({ next, retired, }) {
    return {
      next: function invokeMap (val, order) {
        if (retired.call()) {
          return next(mapper(val), order);
        }
      },
    };
  };
}

function parallel () {
  return function createParallel ({ next, retired, resolve, }) {
    let futures = [];
    return {
      resolve: async function resolveParallel () {
        const copy = futures.slice();
        futures = [];
        await Promise.all(copy.map(task => task()));
        await resolve();
      },
      next: function invokeParallel (val, order) {
        if (retired.call()) {
          futures.push(() => next(val, order));
          return true;
        }
      },
    };
  };
}

function pick (keys) {
  const keySet = createSet(keys);
  return function createPick ({ next, retired, }) {
    return {
      next: function invokePick (val, order) {
        if (retired.call()) {
          val = Object.entries(val)
            .filter(e => keySet[e[0]])
            .reduce(entriesToObject, {});
          return next(val, order);
        }
      },
    };
  };
}

function distinctBy (picker) {
  return function createDistinctBy ({ resolve, next, retired, }) {
    let history = {};
    return {
      resolve: async function resolveDistinctBy () {
        history = {};
        await resolve();
      },
      next: function invokeDistinctBy (val, order) {
        if (retired.call()) {
          const key = picker(val);
          if (!history[key]) {
            history[key] = true;
            return next(val, order);
          }
          return true;
        }
      },
    };
  };
}
function distinct () {
  return function createDistinct ({ resolve, next, retired, }) {
    let history = {};
    return {
      resolve: async function resolveDistinct () {
        history = {};
        await resolve();
      },
      next: function invokeDistinct (val, order) {
        if (retired.call()) {
          if (!history[val]) {
            history[val] = true;
            return next(val, order);
          }
          return true;
        }
      },
    };
  };
}

function filter (predicate) {
  return function createFilter ({ retired, next, }) {
    return {
      next: function invokeFilter (val, order) {
        if (retired.call()) {
          if (predicate(val)) {
            return next(val, order);
          }
          return true;
        }
      },
    };
  };
}

function reject (predicate) {
  return function createReject ({ retired, next, }) {
    return {
      next: function invokeReject (val, order) {
        if (retired.call()) {
          if (!predicate(val)) {
            return next(val, order);
          }
          return true;
        }
      },
    };
  };
}

function omit (keys) {
  const rejectables = new Set(keys);
  return function createOmit ({ retired, next, }) {
    return {
      next: function invokeOmit (val, order) {
        if (retired.call()) {
          val = Object.entries(val).filter(e => !rejectables.has(e[0])).reduce(entriesToObject, {});

          return next(val, order);
        }
      },
    };
  };
}

function where (matcher) {
  const matchEntries = Object.entries(matcher);
  return function createWhere ({ retired, next,  }) {
    return {
      next: function invokeWhere (val, order) {
        if (retired.call()) {
          for (const e of matchEntries) {
            if (val[e[0]] !== e[1]) {
              return true;
            }
          }
          return next(val, order);
        }
      },
    };
  };
}

function skipWhile (predicate) {
  return function createSkipWhile ({ resolve, retired, next, }) {
    let take = false;
    return {
      resolve: function resolveSkipWhile () {
        take = false;
        return resolve();
      },
      next: function invokeSkipWhile (val, order) {
        if (retired.call()) {
          if (take || (take = !predicate(val))) {
            return next(val, order);
          }
          return true;
        }
      },
    };
  };
}

function scan (scanner, acc) {
  return function createScan ({ resolve, retired, next, }) {
    let output = acc;
    let futures = [];
    return {
      resolve: function resolveScan () {
        output = acc;
        futures = [];
        return resolve();
      },
      next: async function invokeScan (val, order) {
        if (retired.call()) {
          futures.push(async (input) => {
            const result = scanner(input, val);
            output = result;
            return next(result, order);
          });
          if (futures.length===1) {
            for (let i = 0; i<futures.length; i++) {
              if (!await futures[i](output)) {
                return false;
              }
            }
            futures = [];
            return true;
          }
        }
      },
    };
  };
}

function takeUntil (predicate) {
  return function createTakeUntil ({ resolve, retired, next, }) {
    let take = true;
    return {
      resolve: function resolveTakeUntil () {
        take=true;
        return resolve();
      },
      retired: retired.concat(() => take),
      next: function invokeTakeUntil (val, order) {
        if (retired.call() && take && (take = !predicate(val))) {
          return next(val, order);
        }
      },
    };
  };
}

function takeWhile (predicate) {
  return function createTakeWhile ({ resolve, retired, next, }) {
    let take = true;
    return {
      resolve: function resolveTakeWhile () {
        take = true;
        return resolve();
      },
      retired: retired.concat(() => take),
      next: function invokeTakeWhile (val, order) {
        if (take && (take = predicate(val)) && retired.call()) {
          return next(val, order);
        }
      },
    };
  };
}

function skip (count) {
  count = Number(count) || 0;
  return function createSkip ({ retired, next, }) {
    let total = 0;
    return {
      next: function invokeSkip (val, order) {
        if (retired.call()) {
          if (total>=count) {
            return next(val, order);
          } else {
            total++;
            return true;
          }
        }
      },
    };
  };
}
function take (max) {
  return function createTake ({ resolve, retired, next, }) {
    max = Number(max) || 0;
    let taken = 0;
    return {
      retired: retired.concat(() => taken < max),
      resolve: function resolveTake () {
        taken = 0;
        return resolve();
      },
      next: function invokeTake (val, order) {
        if (taken < max && retired.call()) {
          taken++;
          return next(val, order);
        }
      },
    };
  };
}

function sum () {
  return function createSum ({ next, retired, resolve, }) {
    let total = 0;
    return {
      resolve: async function resolveSum () {
        const result = total;
        total = 0;
        await next(result, [ 0, ]);
        await resolve();
      },
      next: function invokeSum (val) {
        if (retired.call()) {
          total +=val;
          return true;
        }
      },
    };
  };
}

function reduce (reducer, acc) {
  return function createReduce ({ next, retired, resolve, }) {
    let output = acc;
    return {
      resolve: async function resolveReduce () {
        const result = output;
        output = acc;
        await next(result, [ 0, ]);
        await resolve();
      },
      next: function invokeReduce (val) {
        if (retired.call()) {
          output = reducer(output, val);
          return true;
        }
      },
    };
  };
}

function some (predicate) {
  return function createSome ({ next, retired, resolve, }) {
    let output = false;
    retired = retired.concat(() => !output);
    return {
      retired,
      resolve: async function resolveSome () {
        const result = output;
        output = false;
        await next(result, [ 0, ]);
        await resolve();
      },
      next: function invokeSome (val) {
        if (retired.call()) {
          return !!(output = predicate(val));
        }
      },
    };
  };
}

function every (predicate) {
  return function createEvery ({ next, retired, resolve,  }) {
    let output = true;
    retired = retired.concat(() => output);
    return {
      retired,
      resolve: async function resolveEvery () {
        const result = output;
        output = true;
        await next(result, [ 0, ]);
        return resolve();
      },
      next: function invokeEvery (val) {
        if (retired.call()) {
          return output = !!predicate(val);
        }
      },
    };
  };
}

function await$ (mapper) {
  return function createAwait$ ({ next, retired, }) {
    return {
      next: async function invokeAwait$ (val, order) {
        if (retired.call()) {
          await next(await mapper(val), order);
          return retired.call();
        }
      },
    };
  };
}

function min (comparator) {
  return function createMin ({ next, retired, resolve, }) {
    let min = NOT_SET;
    return {
      resolve: async function resolveMin () {
        if (min!==NOT_SET) {
          await next(min, [ 0, ]);
        }
        await resolve();
      },
      next: function invokeMin (val) {
        if (retired.call()) {
          if (min!==NOT_SET) {
            if (comparator(min, val) > 0) {
              min = val;
            }
          } else {
            min = val;
          }
          return true;
        }
      },
    };
  };
}

function max (comparator) {
  return function createMin ({ next, retired, resolve, }) {
    let max = NOT_SET;
    return {
      resolve: async function resolveMax () {
        if (min!==NOT_SET) {
          await next(max, [ 0, ]);
        }
        await resolve();
      },
      next: function invokeMax (val) {
        if (retired.call()) {
          if (max!==NOT_SET) {
            if (comparator(max, val) < 0) {
              max = val;
            }
          } else {
            max= val;
          }
          return true;
        }
      },
    };
  };
}

function groupBy (callback) {
  return function createGroupBy ({ next, retired, resolve, }) {
    let groups = {};
    return {
      resolve: async function resolveGroupBy () {
        const result = { ...groups, };
        groups = {};
        await next(result);
        await resolve();
      },
      next: function invokeGroupBy (val) {
        if (retired.call()) {
          const group = callback(val);
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(val);
          return true;
        }
      },
    };
  };
}

module.exports = {
  groupBy,
  first,
  reverse,
  sort,
  peek,
  toArray,
  toObject,
  toObjectSet,
  parallel,
  ordered,
  some,
  every,
  toSet,
  toMap,
  flatten,
  map,
  pick,
  distinct,
  distinctBy,
  filter,
  reject,
  omit,
  where,
  skipWhile,
  scan,
  takeWhile,
  takeUntil,
  skip,
  take,
  sum,
  reduce,
  min,
  max,
  default: default$,
  await: await$,
};