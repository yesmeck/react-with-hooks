# react-with-hooks

[![Build Status](https://img.shields.io/travis/yesmeck/react-with-hooks.svg?style=flat-square)](https://travis-ci.org/yesmeck/react-with-hooks)
![codecov](https://img.shields.io/codecov/c/github/yesmeck/react-with-hooks.svg?style=flat-square)

Ponyfill for the [proposed React Hooks API](https://reactjs.org/docs/hooks-intro.html).

Works on RN!

## Install

```bash
$ npm i react-with-hooks --save
```

## Example

```javascript
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
  - [useImperativeMethod](https://reactjs.org/docs/hooks-reference.html#useimperativemethods)
  - ⚠️ useMutationEffect - works same as `useEffect`
  - ⚠️ useLayoutEffect - works same as `useEffect`


## License

[MIT](./LICENSE)
