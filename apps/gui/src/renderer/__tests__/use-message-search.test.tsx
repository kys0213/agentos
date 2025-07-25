import React from 'react';
import renderer, { act } from 'react-test-renderer';
import useMessageSearch from '../hooks/useMessageSearch';
import { Message } from '../components/ChatMessageList';

const msgs: Message[] = [
  { sender: 'user', text: 'hello world' },
  { sender: 'agent', text: 'hi there' },
  { sender: 'user', text: 'bye' },
];

let result: Message[] = [];

const Tester: React.FC<{ term: string }> = ({ term }) => {
  result = useMessageSearch(msgs, term);
  return null;
};

test('filters messages by term', () => {
  const comp = renderer.create(<Tester term="hi" />);
  expect(result).toHaveLength(1);
  expect(result[0].text).toBe('hi there');
  act(() => {
    comp.update(<Tester term="bye" />);
  });
  expect(result).toHaveLength(1);
  expect(result[0].text).toBe('bye');
});
