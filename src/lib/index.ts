import * as _Macy from 'macy';
import MacyComponent from './Macy.svelte';
import type { MacyInit, MacyInstance, MacyOptions, MacyEvents } from '../types';

export const EVENTS: MacyEvents = {
	..._Macy.constants
};
export const Macy = MacyComponent;
export default MacyComponent;
export type { MacyInit, MacyInstance, MacyOptions, MacyEvents };
