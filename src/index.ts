import _Macy from "macy";
import Macy from "./Macy.svelte";
import type { MacyInit, MacyInstance, MacyOptions, MacyEvents } from "./types";

const EVENTS: MacyEvents = {
  ..._Macy.constants,
};
export { Macy, EVENTS };
export type { MacyInit, MacyInstance, MacyOptions, MacyEvents };
