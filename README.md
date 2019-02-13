# react-with-hooks

[![Build Status](https://img.shields.io/travis/yesmeck/react-with-hooks.svg?style=flat-square)](https://travis-ci.org/yesmeck/react-with-hooks)
![codecov](https://img.shields.io/codecov/c/github/yesmeck/react-with-hooks.svg?style=flat-square)

Polyfill and ponyfill for the [React Hooks API](https://reactjs.org/docs/hooks-intro.html).

Works on React Native!

## Install

```bash
$ npm i react-with-hooks --save
```

## Example

You can use `react-with-hooks` as a polyfill; in this case, when you later transition to native React Hooks you will only need to remove the `import 'react-with-hooks/polyfill'` statement:

```javascript
import 'react-with-hooks/polyfill'; // import the polyfill in the entry of your application
import React, { useState, useEffect } from 'react';

const Counter = () => {
  const [ count, setCount ] = useState(0);
  useEffect(() => {
    document.title = "count is " + count;
  })
  return (
    <div>
      {count}
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
};
```

Alternatively, you can use this library as a ponyfill with the `withHooks` helper. In this case, you will have to refactor your code later when you transition to use native React Hooks.

```javascript
import React from 'react';
import withHooks, { useState, useEffect } from 'react-with-hooks';

const Counter = withHooks(() => {
  const [ count, setCount ] = useState(0);
  useEffect(() => {
    document.title = "count is " + count;
  })
  return (
    <div>
      {count}
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
});
```

[Live Demo](https://codesandbox.io/s/olx6zp44n6)

## API Reference

- Basic Hooks
  - [useState](https://reactjs.org/docs/hooks-reference.html#usestate)
  - [useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect)
  - [useContext](https://reactjs.org/docs/hooks-reference.html#usecontext)
- Additional Hooks
  - [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer)
  - [useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback)
  - [useMemo](https://reactjs.org/docs/hooks-reference.html#usememo)
  - [useRef](https://reactjs.org/docs/hooks-reference.html#useref)
  - [useImperativeHandle](https://reactjs.org/docs/hooks-reference.html#useimperativehandle)
  - ⚠️ useLayoutEffect - Not fully implemented, works same as `useEffect` currently.


## License

[MIT](./LICENSE)
