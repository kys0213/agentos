import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ChatInput from '../components/ChatInput';

test('calls onSend when enter pressed', () => {
  const spy = jest.fn();
  const comp = renderer.create(<ChatInput onSend={spy} />);
  const input = comp.root.findByType('input');
  act(() => {
    input.props.onChange({ target: { value: 'hi' } });
    input.props.onKeyDown({ key: 'Enter', preventDefault: () => {} });
  });
  expect(spy).toHaveBeenCalledWith('hi');
});
