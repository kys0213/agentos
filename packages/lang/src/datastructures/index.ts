import { LinkedList } from '@datastructures-js/linked-list';
import { Queue } from '@datastructures-js/queue';
import { Deque } from '@datastructures-js/deque';

export { LinkedList, Queue, Deque };

export type LinkedQueue<T> = Queue<T>;
export type LinkedDeque<T> = Deque<T>;
