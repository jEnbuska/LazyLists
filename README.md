## No longer maintained

Performs asynchronous operations using
familiar functions like 'map', 'filter', 'reduce' etc..

###### No external dependencies
#### Required Node 8 >=
 
```npm install async_operators```

```yarn add async_operators```

## Stream initialization:
```
const { provider } = require('async_operators');
```

#### 'provider' accepts an object as argument and can be initialized on one of four ways 
##### 'generator' works both with generator function and async generators
```
await provider({* generator(){
     yield 'a'
     yield 'b'
}})
.forEach(value => console.log(value')) // 'a', 'b'
.pull();
```
##### 'callback'
```
function returnLater(result){
    return new Promise(resolve => setTimeout(() => resolve(result),  10));
}
await provider({
    async callback({onNext, onComplete}){
        const a = await returnLater('a')
        onNext(a);
        const b = await returnLater('b')
        onNext(b);
        onComplete()
    }
}})
.forEach(value => console.log(value')) // 'a', 'b'
.pull();
```
##### 'flatten' excepts an array
```
await provider({flatten: ['a', 'b']})
.forEach(value => console.log(value')) // 'a', 'b'
.pull();
```
##### 'map' any value
```
await provider({map: ['a', 'b']})
.flatten()
.forEach(value => console.log(value')) // 'a', 'b'
.pull();
```

##### Calling function 'pull' creates the stream, and starts the execution
##### The last operator before 'pull' is the output of the execution
```
const numbers = await provider({map: [1,2,3]})
.flatten()
.map(int => int*2)
.reduce((acc, int) => [...acc, int], [])
.pull();
console.log(numbers); // [2, 4, 6]
```
## reducing:
```
.reduce((acc, next) => [...acc, next], [])
.groupBy(...strings)
.sum()
.min(comparator)
.max(comparator)
.some(callback); // cancels upstream ones true
.every(callback); // cancels upstream ones false
.first(); // cancels upstream ones first resolved
```
## filtering:
```
.filter(callback); 
.reject(callback);
.where(object);
.distinct();
.distinctBy(...strings);
.skip(number).
.skipWhile(callback); 
```

## upstream filtering:
### upstream filters allow cancelling rest of the upstream execution
```
.take(number);
.takeWhile(callback); 
.takeUntil(callback); // invert of takeWhile
```
## mapping:
```
.map(callback)
.pick(...strings)
.omit(...strings)
.scan(callback, seed);
```
## flattening
```
.flatten(callback); // default to Object.values
.keys()  //same as  .flatten(Object.keys)
.values() //same as .flatten(Object.values)
.entries() //same as .flatten(Object.entries)
.generator(* function | async * function)
```
## ordering
```
.parallel(number); // parallel <infinite> by default
.ordered(); // reorders the output 
.reverse(); // reorders and reverses the output
.sort(?callback)
.sortBy(obj); // creates a comparator using object. See next example
```
#### sortBy example
```
.sortBy({name: 'DESC', age: 'ASC', gender: 'DESC'});
```

## catch:
### without catch block all work is stopd on error
```
await provider({flatten: [{name: 'John}, null, {name: 'Lisa'}]})
 .filter(person => person.name!=='John')
 .map(int => int*2)
 .catch((error, info) => {
     console.error(error); // cannot read property 'name' of null
     console.error(JSON.stringify(info)); // {index: 1, name: 'filter', value: null}
 })
 .reduce((acc, person) => [...acc, person], [])
 .pull()
```
## await:
```
.await() // waits until the mapped promise gets resolved

```
## default:
```
.default(any) // emits default value on onComplete if the output would otherwise be empty
const result = await provider({value: 1})
  .filter(it => it!==1)
  .default('NOT_SET')
  .pull()
console.log(result); // 'NOT_SET' 
```
