import lazy from '../src/Lazy';

async function sleep(time, result) {
  return new Promise(res => setTimeout(() => {
    res(result);
  }, time));
}

// TEST 'takeWhile'
describe('lazy', async () => {

  test('reduce synchronous', async function () {
    const [ first, second, ]= await lazy()
      .resolve()
      .reduce()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(first).toBe(30);
    expect(second).toBe(20);
  });

  test('reduce parallel', async function () {
    const [ first, second, ]= await lazy()
      .parallel()
      .resolve()
      .reduce()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(first).toBe(20);
    expect(second).toBe(30);
  });

  test('takeWhile synchronous', async function(){
    const result = await lazy()
      .resolve()
      .takeWhile(({age}) => age < 50)
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }), // 2
        sleep(15, { name: 'Lisa', age: 30, }), // 1
        sleep(30, { name: 'Kim', age: 40, }),
        sleep(20, { name: 'Ted', age: 50, }), // 3
      );
    expect(result).toEqual([ { name: 'John', age: 25, }, { name: 'John', age: 20, }, { name: 'Lisa', age: 30, },{ name: 'Kim', age: 40, }]);
  });

  test('takeWhile parallel', async function(){
    const result = await lazy()
      .parallel()
      .resolve()
      .takeWhile(({age}) => age < 50)
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }), // 2
        sleep(15, { name: 'Lisa', age: 30, }), // 1
        sleep(30, { name: 'Kim', age: 40, }),
        sleep(20, { name: 'Ted', age: 50, }), // 3
      );
    expect(result).toEqual([ { name: 'Lisa', age: 30, }, { name: 'John', age: 20, }, ]);
  });

  test('where synchronous', async function () {
    const [ first, second, third, ]= await lazy()
      .resolve()
      .where({ a: 1, })
      .reduce()
      .invoke(sleep(30, { a: 1, b: 1, }), sleep(20, { a: 1, b: 2, }), sleep(25, { a: 2, b: 1, }));
    expect(first).toEqual({ a: 1, b: 1, });
    expect(second).toEqual({ a: 1, b: 2, });
    expect(third).toBeUndefined();
  });
  test('where parallel', async function () {
    const [ first, second, third, ]= await lazy()
      .parallel()
      .resolve()
      .where({ a: 1, })
      .reduce()
      .invoke(sleep(30, { a: 1, b: 1, }), sleep(20, { a: 1, b: 2, }), sleep(25, { a: 2, b: 1, }));
    expect(first).toEqual({ a: 1, b: 2, });
    expect(second).toEqual({ a: 1, b: 1, });
    expect(third).toBeUndefined();
  });

  test('skip synchronous', async function () {
    const [ first, second, ]= await lazy()
      .resolve()
      .where({ a: 1, })
      .skip(1)
      .reduce()
      .invoke(sleep(30, { a: 1, b: 1, }), sleep(20, { a: 1, b: 2, }), sleep(25, { a: 2, b: 1, }));

    expect(first).toEqual({ a: 1, b: 2, });
    expect(second).toBeUndefined();
  });
  test('skip parallel', async function () {
    const [ first, second, ]= await lazy()
      .parallel()
      .resolve()
      .where({ a: 1, })
      .skip(1)
      .reduce()
      .invoke(sleep(30, { a: 1, b: 1, }), sleep(20, { a: 1, b: 2, }), sleep(15, { a: 2, b: 1, }));

    expect(first).toEqual({ a: 1, b: 1, });
    expect(second).toBeUndefined();
  });

  test('take synchronous', async function () {
    const [ first, second, ]= await lazy()
      .resolve()
      .take(2)
      .reduce()
      .invoke(sleep(30, 30), sleep(20, 20), sleep(10, 10));
    expect(first).toBe(30);
    expect(second).toBe(20);
  });

  test('take parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .take(3)
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }), // 2
        sleep(15, { name: 'Lisa', age: 30, }), // 1
        sleep(30, { name: 'Kim', age: 40, }),
        sleep(20, { name: 'Ted', age: 50, }), // 3
      );
    expect(result).toEqual([ { name: 'Lisa', age: 30, }, { name: 'John', age: 20, }, { name: 'Ted', age: 50, }, ]);
  });

  test('parallel take last', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .takeLast(2)
      .invoke(sleep(30, 30), sleep(20, 20), sleep(40, 40), sleep(35, 35));
    expect(result).toEqual([35, 40]);
  });

  test('map', async function () {
    const [ first, second, ] = await lazy()
      .resolve()
      .map(it => it*2)
      .reduce()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(first).toBe(60);
    expect(second).toBe(40);
  });

  test('scan synchronous', async function () {
    const result = await lazy()
      .resolve()
      .scan((acc = {}, next) => Object.assign(acc, { [next]: true, }))
      .takeLast()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(result).toEqual([{ 30: true, 20: true, }]);
    const result2 = await lazy()
      .resolve()
      .scan((acc = {}, next) => ({ ...acc, [next]: true, }))
      .reduce()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(result2).toEqual([ { 30: true, }, { 30: true, 20: true, }, ]);
  });

  test('scan parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .scan((acc = {}, next) => ({ ...acc, [next]: true, }))
      .reduce()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(result).toEqual([ { 20: true, }, { 30: true, 20: true, }, ]);
    const result2 = await lazy()
      .parallel()
      .resolve()
      .scan((acc = {}, next) => ({ ...acc, [next]: true, }))
      .take(5)
      .reduce()
      .invoke(
        sleep(30, 1), // 4
        sleep(30, 2), // 5
        sleep(20, 3), // 2
        sleep(15, 4), // 1
        sleep(30, 5), // 6
        sleep(20, 6), // 3
      );
    expect(result2).toEqual([
      { 4: true, },
      { 3: true, 4: true, },
      { 3: true, 4: true, 6: true, },
      { 1: true, 3: true, 4: true, 6: true, },
      { 1: true, 2: true, 3: true, 4: true, 6: true, },
    ]);
  });

  test('sum parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .sum()
      .invoke(sleep(30, 30), sleep(20, 20));
    expect(result).toBe(50);
  });

  test('distinctBy synchronous', async function () {
    const result = await lazy()
      .resolve()
      .distinctBy(it => it.name)
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }),
        sleep(15, { name: 'Lisa', age: 30, })
      );
    expect(result).toEqual([ { name: 'John', age: 25, }, { name: 'Lisa', age: 30, }, ]);
  });

  test('distinctBy parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .distinctBy('name')
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }),
        sleep(15, { name: 'Lisa', age: 30, })
      );
    expect(result).toEqual([ { name: 'Lisa', age: 30, }, { name: 'John', age: 20, }, ]);
  });

  test('filter parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .filter(({ age, }) => age>=25)
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }),
        sleep(15, { name: 'Lisa', age: 30, })
      );
    expect(result).toEqual([ { name: 'Lisa', age: 30, }, { name: 'John', age: 25, }, ]);
  });


  test('filter synchronous', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .filter('age')
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: undefined, }),
        sleep(20, { name: 'John', age: 0, }),
        sleep(15, { name: 'Lisa', age: 30, })
      );
    expect(result).toEqual([ { name: 'Lisa', age: 30, }, ]);
  });

  test('peek parallel', async function () {
    const ages = [];
    await lazy()
      .parallel()
      .map(async res => await res)
      .peek(({ age, }) => ages.push(age))
      .distinctBy('name')
      .peek(({ age, }) => ages.push(age))
      .reduce()
      .invoke(
        sleep(30, { name: 'John', age: 25, }),
        sleep(20, { name: 'John', age: 20, }),
        sleep(15, { name: 'Lisa', age: 30, })
      );
    expect(ages).toEqual([ 30, 30, 20, 20, 25, ]);
  });

  test('skipWhile takeUntil synchronous', async function () {
    const result = await lazy()
      .resolve()
      .takeUntil(it => it<5)
      .skipWhile(it => it<2)
      .reduce()
      .invoke(
        sleep(30, 0),
        sleep(30, 1),
        sleep(20, 2),
        sleep(15, 3),
        sleep(30, 4),
        sleep(20, 5),
      );
    expect(result).toEqual([ 2, 3, 4, ]);
  });

  test('skipWhile takeUntil parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .takeUntil(it => it<5)
      .skipWhile(it => it<2)
      .reduce()
      .invoke(
        sleep(30, 0), // 6
        sleep(10, 1), // 1
        sleep(20, 2),  // 4
        sleep(15, 3), // 2
        sleep(18, 4), // 3
        sleep(30, 4), // 7
        sleep(20, 5), // 5
      );
    expect(result).toEqual([ 3, 4, 2, ]);
  });

  test('pick parallel', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .pick('a', 'b')
      .reduce()
      .invoke(
        sleep(30, { a: 1, b: 2, c: 3, }),
        sleep(30, { a: 4, b: 5, c: 6, }),
        sleep(20, { a: 7, b: 8, c: 9, }),
        sleep(15, { a: 10, b: 11, c: 12, }),
        sleep(30, { a: 13, b: 14, c: 15, }),
        sleep(20, { a: 16, b: 17, c: 18, }),
      );
    expect(result).toEqual([
      { a: 10, b: 11, },
      { a: 7, b: 8, },
      { a: 16, b: 17, },
      { a: 1, b: 2, },
      { a: 4, b: 5, },
      { a: 13, b: 14, },
    ]);
  });

  test('parallel ordered', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .pick('a', 'b')
      .ordered()
      .reduce()
      .invoke(
        sleep(30, { a: 1, b: 2, c: 3, }),
        sleep(30, { a: 4, b: 5, c: 6, }),
        sleep(20, { a: 7, b: 8, c: 9, }),
        sleep(15, { a: 10, b: 11, c: 12, }),
        sleep(30, { a: 13, b: 14, c: 15, }),
        sleep(20, { a: 16, b: 17, c: 18, }),
      );
    expect(result).toEqual([
      { a: 1, b: 2, },
      { a: 4, b: 5, },
      { a: 7, b: 8, },
      { a: 10, b: 11, },
      { a: 13, b: 14, },
      { a: 16, b: 17, },
    ]);
  });

  test('sequential parallel ordered', async function () {
    const result = await lazy()
      .parallel()
      .resolve()
      .pick('a', 'b')
      .ordered()
      .parallel()
      .map(next => sleep(20-next.a, next))
      .ordered()
      .reduce()
      .invoke(
        sleep(30, { a: 1, b: 2, c: 3, }),
        sleep(30, { a: 4, b: 5, c: 6, }),
        sleep(20, { a: 7, b: 8, c: 9, }),
        sleep(15, { a: 10, b: 11, c: 12, }),
        sleep(30, { a: 13, b: 14, c: 15, }),
        sleep(20, { a: 16, b: 17, c: 18, }),
      );
    expect(result).toEqual([
      { a: 1, b: 2, },
      { a: 4, b: 5, },
      { a: 7, b: 8, },
      { a: 10, b: 11, },
      { a: 13, b: 14, },
      { a: 16, b: 17, },
    ]);
  });

  test('flatten synchronous',async function(){
    const result = await lazy()
      .flatten()
      .reduce()
      .invoke([[1,2,3], [4,3,1]], [[3,2,1], [2,2,2]]);
    expect(result).toEqual([[1,2,3], [4,3,1],[3,2,1],[2,2,2]])
    const result2 = await lazy()
      .flatten()
      .flatten()
      .reduce()
      .invoke([[1,2,3], [4,3,1]], [[3,2,1], [2,2,2]]);
    expect(result2).toEqual([1,2,3, 4,3,1,3,2,1,2,2,2])
  })

  test('flatten parallel',async function(){
    const result = await lazy()
      .parallel()
      .resolve()
      .flatten()
      .reduce()
      .invoke(sleep(5, [[1,2,3], [4,3,1]]), sleep(1, [[3,2,1], [2,2,2]]));
    expect(result).toEqual([[3,2,1],[2,2,2], [1,2,3], [4,3,1]]);

    const result2 = await lazy()
      .parallel()
      .resolve()
      .flatten()
      .parallel()
      .resolve()
      .flatten()
      .reduce()
      .invoke(sleep(20, [sleep(30,[1,2,3]), sleep(0, [4,3,1])]), sleep(10, [sleep(5, [3,2,1]), sleep(25, [2,2,2])]));
    expect(result2).toEqual([3,2,1, 4,3,1,2,2,2, 1,2,3])
  })

  test('flatten parallel ordered',async function(){
    const result = await lazy()
      .parallel()
      .resolve()
      .flatten()
      .ordered()
      .reduce()
      .invoke(sleep(5, [[1,2,3], [4,3,1]]), sleep(1, [[3,2,1], [2,2,2]]));
    expect(result).toEqual([[1,2,3], [4,3,1], [3,2,1],[2,2,2], ]);

    const result2 = await lazy()
      .parallel()
      .resolve()
      .flatten()
      .parallel()
      .resolve()
      .flatten()
      .ordered()
      .reduce()
      .invoke(sleep(20, [sleep(30,[1,2,3]), sleep(0, [4,3,1])]), sleep(10, [sleep(5, [3,2,1]), sleep(25, [2,2,2])]));
    expect(result2).toEqual([1,2,3,4,3,1,3,2,1,2,2,2])
  })
});
