import React from 'react';
import renderer from 'react-test-renderer';
import ChatMessageList from '../ChatMessageList';

const msgs = [
  { sender: 'user', text: 'hi' },
  { sender: 'agent', text: 'hello' },
];

test('renders messages', () => {
  const tree = renderer.create(<ChatMessageList messages={msgs} />).toJSON();
  expect(tree).toBeTruthy();
});
