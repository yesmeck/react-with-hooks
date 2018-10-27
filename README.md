# react-with-hooks

Ponyfill for the [proposed React Hooks API](https://reactjs.org/docs/hooks-intro.html).

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
       <button onClick={() => setCount(count + 1)}>-</button>
    </div>
  );
});
```

## License

MIT
