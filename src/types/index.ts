type MacyOptionsWithContainer = {
	container: string;
	columns?: number;
	trueOrder?: boolean;
	margin?:
		| number
		| {
				x?: number | string;
				y?: number;
		  };
	waitForImages?: boolean;
	useOwnImageLoader?: boolean;
	mobileFirst?: boolean;
	breakAt?: {
		[viewport: number]:
			| number
			| {
					margin?: { x?: number; y?: number };
					columns?: number;
			  };
	};
	cancelLegacy?: boolean;
	useContainerForBreakpoints?: boolean;
};
export type MacyInstance = {
	/**
	 * Recalculates masonory positions
	 * @param  {Boolean} refresh - Recalculates All elements within the container
	 * @param  {Boolean} loaded  - When true it sets the recalculated elements to be marked as complete
	 */
	recalculate: (refresh?: boolean, loaded?: boolean) => void;
	/**
	 * Run a function on every image load or once all images are loaded
	 * @param  {Function}  func      - Function to run on image load
	 * @param  {Boolean} everyLoad   - If true it will run everytime an image loads
	 */
	runOnImageLoad: (func: () => void, everyLoad: boolean) => void;
	/**
	 * Destroys macy instance
	 */
	remove: () => void;
	/**
	 * ReInitializes the macy instance using the already defined options
	 */
	reInit: () => void;
	/**
	 * Event listener for macy events
	 * @param key {String} - Event name to listen to
	 * @param func {Function} - Function to be called when event happens
	 */
	on: (key: string, func: () => void) => void;
	/**
	 * Emit an event to macy.
	 * @param key {String} - Event name to listen to
	 * @param data {Object} - Extra data to be passed to the event object that is passed to the event listener.
	 */
	emit: (key: string, data: any) => void;
};

export type MacyInit = {
	(options: MacyOptionsWithContainer): MacyInstance;
	constants: MacyEvents;
};
export type MacyOptions = Omit<MacyOptionsWithContainer, 'container'>;
export type MacyEvents = {
	EVENT_IMAGE_COMPLETE: 'macy.images.complete';
	EVENT_IMAGE_ERROR: 'macy.image.error';
	EVENT_IMAGE_LOAD: 'macy.image.load';
	EVENT_INITIALIZED: 'macy.initialized';
	EVENT_RECALCULATED: 'macy.recalculated';
	EVENT_RESIZE: 'macy.resize';
};
