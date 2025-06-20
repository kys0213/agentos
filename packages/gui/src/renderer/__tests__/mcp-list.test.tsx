import React from 'react';
import renderer from 'react-test-renderer';
import McpList from '../pages/McpList';
import { McpConfig } from '@agentos/core';

const sample: McpConfig = {
  type: 'stdio',
  name: 'test',
  version: '1',
  command: 'echo',
};

test('renders empty message', () => {
  const tree = renderer.create(<McpList mcps={[]} onClose={() => {}} />).toJSON();
  expect(tree).toBeTruthy();
});

test('renders provided MCPs', () => {
  const component = renderer.create(<McpList mcps={[sample]} onClose={() => {}} />);
  const li = component.root.findByType('li');
  expect(li.children.join('')).toContain('test');
});
