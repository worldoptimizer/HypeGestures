/*!
Hype Slide Gesture 1.0.0
copyright (c) 2021 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/*
* Version-History
* 1.0.0	Initial release under MIT-license

*/
if("HypeSlideGesture" in window === false) window['HypeSlideGesture'] = (function () {

	function HypeDocumentLoad (hypeDocument, element, event) {

		/**
		 * This function handles a custom continue after drag behavior if called in "On Drag" JavaScript action
		 *
		 * @param {String} event or gesture phase 
		 * @return {Object} containing config overrides
		 */
		hypeDocument.continueAfterDrag = function(hypeDocument, element, event, config){
			
			// limit this Hype function to drag and drop
			if (!(event && event.hypeGesturePhase)) return;

			//gate ondrag
			config = config || {};
			
			// prep vars based on config
			var instance =  config.symbolInstance || hypeDocument; //autodetect?!
			var timelineName = config.timelineName || 'timelineName'; 
			var borderMode = config.borderMode || 'bounce'; // default?
			var ms = config.ms || 100;
			var maxVelocityTick =  (Math.abs(config.maxVelocity) || 12) / 60;
			var friction = config.friction || 0.95;
			var borderFriction = config.borderFriction || 0.1;
			var treshold = config.treshold || 0.01;
			var time = instance.currentTimeInTimelineNamed(timelineName);
			var duration = instance.durationForTimelineNamed(timelineName);
			
			// switch based on event.eventGesturePhase
			switch(event.hypeGesturePhase) {

				// start
				case hypeDocument.kHypeGesturePhaseStart:
					instance.isDragging = true;	
					instance.dragTime = time;
					clearInterval(instance.interval);
					instance.interval = setInterval(function(){
						instance.dragTime = instance.currentTimeInTimelineNamed(timelineName);
					}, ms);

					var expression = element.getAttribute('data-timeline-drag-start-action');
					if (expression) hypeDocument.triggerAction (expression, {
						element: element,
						event: Object.assign({
							instance: instance,
							dragGesturePhase: 'TimelineDragStart'
						}, event)
					});
					break;

				// end, cancel
				case hypeDocument.kHypeGesturePhaseEnd:
				case hypeDocument.kHypeGesturePhaseCancel:
					instance.isDragging = false;
					instance.dragDiff = Math.min(Math.max(time - instance.dragTime, -maxVelocityTick), maxVelocityTick);
					clearInterval(instance.interval);
					instance.interval = setInterval(function(){
						var time = instance.currentTimeInTimelineNamed(timelineName);
						
						if (time + instance.dragDiff > duration) {
							var overshot = time + instance.dragDiff - duration;
							switch(borderMode) {
								case 'bounce':
									instance.goToTimeInTimelineNamed(duration - overshot*borderFriction, timelineName);
									instance.dragDiff *= borderFriction;
									instance.dragDiff *= -1;
									break;
								
								case 'shift':
									instance.goToTimeInTimelineNamed(overshot, timelineName);
									break;
									
								case 'none':
								default:
									instance.goToTimeInTimelineNamed(duration, timelineName);
									instance.dragDiff = 0;
									break;
							}
						} else if (time + instance.dragDiff < 0){
							var overshot = time + instance.dragDiff;
							switch(borderMode) {
								case 'bounce':
									instance.goToTimeInTimelineNamed(-overshot*borderFriction, timelineName);
									instance.dragDiff *= borderFriction;
									instance.dragDiff *= -1;
									break;
								
								case 'shift':
									instance.goToTimeInTimelineNamed(duration-overshot, timelineName);
									break;
									
								case 'none':
								default:
									instance.goToTimeInTimelineNamed(0, timelineName);
									instance.dragDiff = 0;
									break;
							}
						} else {
							instance.goToTimeInTimelineNamed(Math.round((time + instance.dragDiff)*100)/100, timelineName);
						}
						
						instance.dragDiff *= friction;
						if (Math.abs(instance.dragDiff) < treshold ) {
							instance.pauseTimelineNamed(timelineName)
							clearInterval(instance.interval);

							var expression = element.getAttribute('data-timeline-slide-end-action');
							if (expression) hypeDocument.triggerAction (expression, {
								element: element,
								event: Object.assign({
									instance: instance,
									dragGesturePhase: 'TimelineSlideEnd'
								}, event)
							});
							
						} else {

							var expression = element.getAttribute('data-timeline-slide-move-action');
							if (expression) hypeDocument.triggerAction (expression, {
								element: element,
								event: Object.assign({
									instance: instance,
									dragGesturePhase: 'TimelineSlideMove'
								}, event)
							});
							
						}
					},1000/60);

					var expression = element.getAttribute('data-timeline-drag-end-action');
					if (expression) hypeDocument.triggerAction (expression, {
						element: element,
						event: Object.assign({
							instance: instance,
							dragGesturePhase: 'TimelineDragEnd'
						}, event)
					});
					break;
				
				case hypeDocument.kHypeGesturePhaseMove:

					var expression = element.getAttribute('data-timeline-drag-move-action');
					if (expression) hypeDocument.triggerAction (expression, {
						element: element,
						event: Object.assign({
							instance: instance,
							dragGesturePhase: 'TimelineDragMove'
						}, event)
					});
					break;
			}
		}
	}

	/* setup callbacks */
	if("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array();}
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback": HypeDocumentLoad});

	/**
	 * @typedef {Object} HypeSlideGesture
	 * @property {String} version Version of the extension
	 * @property {Function} sample Boilerplate text
	 */
	var HypeSlideGesture = {
		version: '1.0.0',
	};

	/** 
	 * Reveal Public interface to window['HypeSlideGesture']
	 * return {HypeSlideGesture}
	 */
	return HypeSlideGesture;
	
})();


/*!
Hype Drag Gesture 1.0.0
copyright (c) 2021 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/*
* Version-History
* 1.0.0	Initial release under MIT-license

*/
if("HypeDragGesture" in window === false) window['HypeDragGesture'] = (function () {

	function HypeDocumentLoad (hypeDocument, element, event) {
		
		/**
		 * This function is to be called in an "On Drag" action.
		 *
		 * @param {String} hypeDocument forward the API
		 * @param {HTMLDivElement} element forward the element
		 * @param {Object} event forward the event
		 */
			hypeDocument.onDrag = function(hypeDocument, element, event){

			//TODO drag group and resolve data-drag-group in 1.0.5
			
			// limit this Hype function to drag and drop
			if (!event.hypeGesturePhase) return;
			
			// prep vars
			var sceneElm = document.getElementById(hypeDocument.currentSceneId());
			
			// evalute base on drag phase
			switch (event.hypeGesturePhase) {
				
				// start
				case hypeDocument.kHypeGesturePhaseStart:
					// if there is no data-intersecting attribute create one
					if (!element.getAttribute('data-intersecting')) element.setAttribute('data-intersecting', 'false');
			
					// store position drag originated from
					var dragStartTop = hypeDocument.getElementProperty(element, 'top');
					var dragStartLeft = hypeDocument.getElementProperty(element, 'left');
					element.setAttribute('data-drag-start-top', dragStartTop);
					element.setAttribute('data-drag-start-left', dragStartLeft);

					// trigger actions found on the element in [data-drag-start-action]	and defaults
					var expression = element.getAttribute('data-drag-start-action');
					if (expression) hypeDocument.triggerAction (expression, {
						element: element,
						event: Object.assign({
							dragStartTop: dragStartTop,
							dragStartLeft: dragStartLeft,
							dragGesturePhase: 'DragStart'
						}, event)
					});

					break;
					
				// move
				case hypeDocument.kHypeGesturePhaseMove:
					// trigger actions found on the element in [data-drag-move-action] and defaults
					var expression = element.getAttribute('data-drag-move-action');
					if (expression) hypeDocument.triggerAction (expression, {
						element: element,
						event: Object.assign({
							dragGesturePhase: 'DragMove'
						}, event)
					});
					break;
			}

			// process intersections
			
			// query dropTargetElms
			var intersectionElms;
			var dropTargetElms = sceneElm.querySelectorAll(element.getAttribute('data-drop-selector'));
			
			if (dropTargetElms) {
			
				//query intersections
				intersectionElms = hypeDocument.queryIntersections(element, dropTargetElms);

				// toggle data attribute data-intersecting
				if (intersectionElms.length) {

					// gate this trigger to case the state diverges
					if (element.getAttribute('data-intersecting')!='true') {

						// trigger  actions found on the element in [data-intersect-start-action] and defaults
						var expression = element.getAttribute('data-intersection-start-action');
						if (expression) hypeDocument.triggerAction (expression, {
							element: element,
							event: Object.assign({
								intersectionElms: intersectionElms,
								dragGesturePhase: 'IntersectionStart'
							}, event)
						});
					}

				} else {

					// gate this trigger to case the state diverges
					if (element.getAttribute('data-intersecting')!='false') {

						// trigger actions found on the element in [data-intersect-end-action] and defaults
						var expression = element.getAttribute('data-intersection-end-action');
						if (expression) hypeDocument.triggerAction (expression, {
							element: element,
							event: Object.assign({
								dragGesturePhase: 'IntersectionEnd'
							}, event)
						});
					}

				}

				// remeber last intersection check
				element.setAttribute('data-intersecting', intersectionElms.length? 'true' : 'false');
			}

			// process end and cancel gesture phase 
			switch (event.hypeGesturePhase) {
			
				// end, cancel
				case hypeDocument.kHypeGesturePhaseEnd:
				case hypeDocument.kHypeGesturePhaseCancel:
				
					// trigger actions found on the element in [data-drag-end-action] and defaults
					var expression = element.getAttribute('data-drag-end-action');
					if (expression) hypeDocument.triggerAction (expression, {
						element: element,
						event: Object.assign({
							dragGesturePhase: 'DragEnd'
						}, event)
					});
		
					if (dropTargetElms) {
						// determine if our element being dragged intersects with a drop target
						//intersectionElms = hypeDocument.queryIntersections(element, dropTargetElms);
						if (intersectionElms.length) {
						
							// trigger actions found on the element in [data-drop-success-action] and defaults
							var expression = element.getAttribute('data-drop-success-action');
							if (expression) hypeDocument.triggerAction (expression, {
								element: element,
								event: Object.assign({
									intersectionElms: intersectionElms,
									dragGesturePhase: 'DropSuccess'
								}, event)
							});
							
						} else {
							
							// trigger actions found on the element in [data-drop-fail-action] and defaults
							var expression = element.getAttribute('data-drop-fail-action');
							if (expression) hypeDocument.triggerAction (expression, {
								element: element,
								event: Object.assign({
									dragGesturePhase: 'DropFail'
								}, event)
							});
						}
					}
				
					// garbage collect intersecting on end, cancel
					element.removeAttribute('data-intersecting');

					break;
			}	
		}
	}

	/* setup callbacks */
	if("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array();}
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback": HypeDocumentLoad});

	/**
	 * @typedef {Object} HypeDragGesture
	 * @property {String} version Version of the extension
	 * @property {Function} sample Boilerplate text
	 */
	var HypeDragGesture = {
		version: '1.0.0',
	};

	/** 
	 * Reveal Public interface to window['HypeDragGesture']
	 * return {HypeDragGesture}
	 */
	return HypeDragGesture;
	
})();