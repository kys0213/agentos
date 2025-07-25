import React from 'react';
import renderer from 'react-test-renderer';
import ChatMessageList, { Message } from '../components/ChatMessageList';

const now = new Date('2023-01-01T00:00:00Z');
const msgs: Message[] = [
  { sender: 'user', text: 'hi', timestamp: now },
  { sender: 'agent', text: 'hello', timestamp: now },
];

test('renders messages', () => {
  const tree = renderer.create(<ChatMessageList messages={msgs} />).toJSON();
  expect(tree).toBeTruthy();
});

test('shows spinner when loading', () => {
  const comp = renderer.create(<ChatMessageList messages={msgs} loading />);
  const spinner = comp.root.findByType('svg');
  expect(spinner).toBeTruthy();
});
