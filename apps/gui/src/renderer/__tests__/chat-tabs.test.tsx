import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ChatTabs, { ChatTab } from '../components/ChatTabs';

test('renders tabs and highlights active', () => {
  const tabs: ChatTab[] = [
    { id: '1', title: 'One' },
    { id: '2', title: 'Two' },
  ];
  const tree = renderer
    .create(<ChatTabs tabs={tabs} activeTabId="2" onSelect={() => {}} />)
    .toJSON();
  expect(tree).toBeTruthy();
});

test('calls onSelect when tab clicked', () => {
  const tabs: ChatTab[] = [
    { id: 'a', title: 'A' },
    { id: 'b', title: 'B' },
  ];
  const spy = jest.fn();
  const comp = renderer.create(<ChatTabs tabs={tabs} activeTabId="a" onSelect={spy} />);
  const firstTab = comp.root.findAllByType('div')[1];
  act(() => {
    firstTab.props.onClick();
  });
  expect(spy).toHaveBeenCalledWith('a');
});
