import React from 'react';
import { mount } from 'enzyme';
import withHooks, { useState } from '../src';

test('useState', () => {
  const Counter = withHooks(() => {
    const [count, setCount] =  useState(0);
    return (
      <div>
        <div className="count">{count}</div>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    );
  })
  const wrapper = mount(<Counter />);
  expect(wrapper.find('.count').text()).toBe('0');
  wrapper.find('button').simulate('click');
  expect(wrapper.find('.count').text()).toBe('1');
});

test('useState with initial function ', () => {
  const Counter = withHooks(() => {
    const [count] =  useState(() => 0);
    return (
      <div>{count}</div>
    );
  })
  const wrapper = mount(<Counter />);
  expect(wrapper.text()).toBe('0');
});
