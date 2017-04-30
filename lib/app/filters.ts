import { Status } from './defs';

let typeOf = typeof undefined;
export type Query = [string, typeof typeOf] | { [key: string]: Query }
export type Filter = [Query, (query: any) => (s: Status) => boolean];

let foo = typeof {};
type Foo = typeof foo

const filters: { [key: string]: Filter } = {
    'tag': [
        ['tag name', typeof "name"],
        (name: string) => (s: Status) => {
            return s.tags.find(t => t.name === name) !== undefined;
        }
    ],
    'sensitve': [
        ['is sensitive', typeof true],
        (flag: boolean) => (s: Status) => {
            return typeof s.sensitive !== undefined || s.sensitive === flag;
        }
    ],
    'hasMedia': [
        {},
        (none: {}) => (s: Status) => s.media_attachments.length > 0
    ]
};

export default filters;