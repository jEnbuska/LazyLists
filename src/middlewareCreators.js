/* eslint-disable consistent-return */
import { NOT_SET, createSet, orderComparator, entriesToObject, } from './utils';

export function first () {
  return function createFirst ({ resolve, upStreamActive, nextMiddleware, }) {
    let value = NOT_SET;
    upStreamActive = upStreamActive.concat(() => value === NOT_SET);
    return {
      upStreamActive,
      resolve: async function resolveFirst () {
        const output = value;
        value = NOT_SET;
        await nextMiddleware(output, []);
        await resolve();
      },
      nextMiddleware: async function createFirst (val) {
        if (upStreamActive.call()) {
          value = val;
        }
      },
    };
  };
}

export function entries () {
  return function createEntries ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: function invokeEntries (val, order) {
        if (upStreamActive.call()) {
          return nextMiddleware(Object.entries(val), order);
        }
      },
    };
  };
}

export function keys () {
  return function createKeys ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: function invokeKeys (val, order) {
        if (upStreamActive.call()) {
          return nextMiddleware(Object.keys(val), order);
        }
      },
    };
  };
}

export function values () {
  return function createValues ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: function invokeValues (val, order) {
        if (upStreamActive.call()) {
          return nextMiddleware(Object.values(val), order);
        }
      },
    };
  };
}

export function reverse () {
  return function createReverse ({ nextMiddleware, upStreamActive, resolve, }) {
    let tasks = [];
    return {
      resolve: async function resolveReversed () {
        const runnables = tasks.reverse();
        tasks = [];
        for (let i = 0; i < runnables.length && await runnables[i](); i++) {}
        await resolve();
      },
      nextMiddleware: function invokeReverse (val, order) {
        if (upStreamActive.call()) {
          tasks.push(() => nextMiddleware(val, order));
          return true;
        }
      },
    };
  };
}

export function sort (comparator) {
  return function createSort ({ nextMiddleware, upStreamActive, resolve, }) {
    let tasks = [];
    return {
      resolve: async function resolveSort () {
        const runnables = tasks.sort(function (a, b) {
          return comparator(a.val, b.val);
        });
        tasks = [];
        for (let i = 0; i < runnables.length && await runnables[i].task(); i++) {}
        return resolve();
      },
      nextMiddleware: function invokeReverse (val, order) {
        if (upStreamActive.call()) {
          tasks.push({ val, task: () => nextMiddleware(val, order), });
          return true;
        }
      },
    };
  };
}

export function peek (callback) {
  return function createPeek ({ upStreamActive, nextMiddleware, }) {
    return {
      nextMiddleware: function invokePeek (val, order) {
        if (upStreamActive.call()) {
          callback(val);
          return nextMiddleware(val, order);
        }
      },
    };
  };
}

export function toArray () {
  return function createToArray ({ upStreamActive, nextMiddleware, resolve, }) {
    let acc = [];
    return {
      resolve: async function resolveToArray () {
        const result = acc;
        acc = [];
        await nextMiddleware(result);
        await resolve();
      },
      nextMiddleware: function invokeToArray (val) {
        if (upStreamActive.call()) {
          acc.push(val);
          return true;
        }
      },
    };
  };
}

export function toSet (picker) {
  return function createToArray ({ upStreamActive, nextMiddleware, resolve, }) {
    let acc = new Set();
    return {
      resolve: async function resolveToSet () {
        let result = acc;
        acc = new Set();
        await nextMiddleware(result);
        await resolve();
      },
      nextMiddleware: function invokeToSet (val) {
        if (upStreamActive.call()) {
          acc.add(picker(val));
          return true;
        }
      },
    };
  };
}

export function toObject (picker) {
  return function createToObject ({ upStreamActive, nextMiddleware, resolve, }) {
    let acc = {};
    return {
      resolve: async function resolveToObject () {
        const result = acc;
        acc = {};
        await nextMiddleware(result);
        await resolve();
      },
      nextMiddleware: function invokeToObject (val) {
        if (upStreamActive.call()) {
          acc[picker(val)] = val;
          return true;
        }
      },
    };
  };
}

export function toObjectSet (picker) {
  return function createToArray ({ upStreamActive, nextMiddleware, resolve, }) {
    let acc = {};
    return {
      resolve: async function resolveToObjectSet () {
        let result = acc;
        acc = {};
        await nextMiddleware(result);
        await resolve();
      },
      nextMiddleware: function invokeToObjectSet (val) {
        if (upStreamActive.call()) {
          acc[picker(val)] = true;
          return true;
        }
      },
    };
  };
}
export function toMap (picker) {
  return function createToMap ({ upStreamActive, nextMiddleware, resolve, }) {
    let acc = new Map();
    return {
      resolve: async function resolveToMap () {
        const result = acc;
        acc = new Map();
        await nextMiddleware(result);
        await resolve();
      },
      nextMiddleware: function invokeToObject (val) {
        if (upStreamActive.call()) {
          acc.set(picker(val), val);
          return true;
        }
      },
    };
  };
}

export function ordered () {
  return function createOrdered ({ nextMiddleware, upStreamActive, resolve, }) {
    let tasks = {};
    return {
      resolve: async function resolveOrdered () {
        const runnables = Object.entries(tasks).sort((e1, e2) => orderComparator(e1[0], e2[0])).map((e) => e[1]);
        tasks = {};
        for (let i = 0; i < runnables.length && await runnables[i](); i++) {}
        await resolve();
      },
      nextMiddleware: function invokeOrdered (val, order) {
        if (upStreamActive.call()) {
          tasks[order] = () => nextMiddleware(val, order);
          return true;
        }
      },
    };
  };
}

export function flatten (iterator) {
  return function createFlatten ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: async function invokeFlatten (val, order) {
        if (upStreamActive.call()) {
          const iterable = iterator(val);
          let i = 0;
          for (const v of iterable) {
            if (!await nextMiddleware(v, [ ...order, i++, ])) {
              return false;
            }
          }
          return true;
        }
      },
    };
  };
}

export function map (mapper) {
  return function createMap ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: function invokeMap (val, order) {
        if (upStreamActive.call()) {
          return nextMiddleware(mapper(val), order);
        }
      },
    };
  };
}

export function parallel () {
  return function createParallel ({ nextMiddleware, upStreamActive, resolve, }) {
    let tasks = [];
    return {
      resolve: async function resolveParallel () {
        const copy = tasks.slice();
        tasks = [];
        await Promise.all(copy.map(task => task()));
        await resolve();
      },
      nextMiddleware: function invokeParallel (val, order) {
        if (upStreamActive.call()) {
          tasks.push(() => nextMiddleware(val, order));
          return true;
        }
      },
    };
  };
}

export function pick (keys) {
  const keySet = createSet(keys);
  return function createPick ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: function invokePick (val, order) {
        if (upStreamActive.call()) {
          val = Object.entries(val)
            .filter(e => keySet[e[0]])
            .reduce(entriesToObject, {});
          return nextMiddleware(val, order);
        }
      },
    };
  };
}

export function distinctBy (picker) {
  return function createDistinctBy ({ resolve, nextMiddleware, upStreamActive, }) {
    let history = {};
    return {
      resolve: async function resolveDistinctBy () {
        history = {};
        await resolve();
      },
      nextMiddleware: function invokeDistinctBy (val, order) {
        if (upStreamActive.call()) {
          const key = picker(val);
          if (!history[key]) {
            history[key] = true;
            return nextMiddleware(val, order);
          }
          return true;
        }
      },
    };
  };
}
export function distinct () {
  return function createDistinct ({ resolve, nextMiddleware, upStreamActive, }) {
    let history = {};
    return {
      resolve: async function resolveDistinct () {
        history = {};
        await resolve();
      },
      nextMiddleware: function invokeDistinct (val, order) {
        if (upStreamActive.call()) {
          if (!history[val]) {
            history[val] = true;
            return nextMiddleware(val, order);
          }
          return true;
        }
      },
    };
  };
}

export function filter (predicate) {
  return function createFilter ({ upStreamActive, nextMiddleware, }) {
    return {
      nextMiddleware: function invokeFilter (val, order) {
        if (upStreamActive.call()) {
          if (predicate(val)) {
            return nextMiddleware(val, order);
          }
          return true;
        }
      },
    };
  };
}

export function where (matcher) {
  const matchEntries = Object.entries(matcher);
  return function createWhere ({ upStreamActive, nextMiddleware,  }) {
    return {
      nextMiddleware: function invokeWhere (val, order) {
        if (upStreamActive.call()) {
          for (const e of matchEntries) {
            if (val[e[0]] !== e[1]) {
              return true;
            }
          }
          return nextMiddleware(val, order);
        }
      },
    };
  };
}

export function skipWhile (predicate) {
  return function createSkipWhile ({ resolve, upStreamActive, nextMiddleware, }) {
    let take = false;
    return {
      resolve: function resolveSkipWhile () {
        take = false;
        return resolve();
      },
      nextMiddleware: function invokeSkipWhile (val, order) {
        if (upStreamActive.call()) {
          if (take || (take = !predicate(val))) {
            return nextMiddleware(val, order);
          }
          return true;
        }
      },
    };
  };
}

export function scan (scanner, acc) {
  return function createScan ({ resolve, upStreamActive, nextMiddleware, }) {
    let output = acc;
    let futures = [];
    return {
      resolve: function resolveScan () {
        output = acc;
        futures = [];
        return resolve();
      },
      nextMiddleware: async function invokeScan (val, order) {
        if (upStreamActive.call()) {
          futures.push(async (input) => {
            const result = scanner(input, val);
            output = result;
            return nextMiddleware(result, order);
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

export function takeUntil (predicate) {
  return function createTakeUntil ({ resolve, upStreamActive, nextMiddleware, }) {
    let take = true;
    return {
      resolve: function resolveTakeUntil () {
        take=true;
        return resolve();
      },
      upStreamActive: upStreamActive.concat(() => take),
      nextMiddleware: function invokeTakeUntil (val, order) {
        if (upStreamActive.call() && take && (take = !predicate(val))) {
          return nextMiddleware(val, order);
        }
      },
    };
  };
}

export function takeWhile (predicate) {
  return function createTakeWhile ({ resolve, upStreamActive, nextMiddleware, }) {
    let take = true;
    return {
      resolve: function resolveTakeWhile () {
        take = true;
        return resolve();
      },
      upStreamActive: upStreamActive.concat(() => take),
      nextMiddleware: function invokeTakeWhile (val, order) {
        if (take && (take = predicate(val)) && upStreamActive.call()) {
          return nextMiddleware(val, order);
        }
      },
    };
  };
}

export function skip (count) {
  count = Number(count) || 0;
  return function createSkip ({ upStreamActive, nextMiddleware, }) {
    let total = 0;
    return {
      nextMiddleware: function invokeSkip (val, order) {
        if (upStreamActive.call()) {
          if (total>=count) {
            return nextMiddleware(val, order);
          } else {
            total++;
            return true;
          }
        }
      },
    };
  };
}
export function take (max) {
  return function createTake ({ resolve, upStreamActive, nextMiddleware, }) {
    max = Number(max) || 0;
    let taken = 0;
    return {
      upStreamActive: upStreamActive.concat(() => taken < max),
      resolve: function resolveTake () {
        taken = 0;
        return resolve();
      },
      nextMiddleware: function invokeTake (val, order) {
        if (taken < max && upStreamActive.call()) {
          taken++;
          return nextMiddleware(val, order);
        }
      },
    };
  };
}

export function sum () {
  return function createSum ({ nextMiddleware, upStreamActive, resolve, }) {
    let total = 0;
    return {
      resolve: async function resolveSum () {
        const result = total;
        total = 0;
        await nextMiddleware(result, [ 0, ]);
        await resolve();
      },
      nextMiddleware: async function invokeSum (val) {
        if (upStreamActive.call()) {
          total +=val;
          return true;
        }
      },
    };
  };
}

export function reduce (reducer, acc) {
  return function createReduce ({ nextMiddleware, upStreamActive, resolve, }) {
    let output = acc;
    return {
      resolve: async function resolveReduce () {
        const result = output;
        output = acc;
        await nextMiddleware(result, [ 0, ]);
        await resolve();
      },
      nextMiddleware: async function invokeReduce (val) {
        if (upStreamActive.call()) {
          output = reducer(output, val);
          return true;
        }
      },
    };
  };
}

export function some (predicate) {
  return function createSome ({ nextMiddleware, upStreamActive, resolve, }) {
    let output = false;
    upStreamActive = upStreamActive.concat(() => !output);
    return {
      upStreamActive,
      resolve: async function resolveSome () {
        const result = output;
        output = false;
        await nextMiddleware(result, [ 0, ]);
        await resolve();
      },
      nextMiddleware: async function invokeSome (val) {
        if (upStreamActive.call()) {
          return !!(output = predicate(val));
        }
      },
    };
  };
}

export function every (predicate) {
  return function createEvery ({ nextMiddleware, upStreamActive, resolve,  }) {
    let output = true;
    upStreamActive = upStreamActive.concat(() => output);
    return {
      upStreamActive,
      resolve: async function resolveEvery () {
        const result = output;
        output = true;
        await nextMiddleware(result, [ 0, ]);
        return resolve();
      },
      nextMiddleware: async function invokeEvery (val) {
        if (upStreamActive.call()) {
          return output = !!predicate(val);
        }
      },
    };
  };
}

export function await$ (mapper) {
  return function createAwait$ ({ nextMiddleware, upStreamActive, }) {
    return {
      nextMiddleware: async function invokeAwait$ (val, order) {
        if (upStreamActive.call()) {
          await nextMiddleware(await mapper(val), order);
        }
      },
    };
  };
}