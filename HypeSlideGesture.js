
/*!
Hype Slide Gesture 1.0.0
copyright (c) 2021 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/*
* Version-History
* 1.0.0	Initial release under MIT-license
*/
if("HypeSlideGesture" in window === false) window['HypeSlideGesture'] = (function () {

	function continueAfterDrag (hypeDocument, element, event, config){
			
		// limit this Hype function to drag and drop
		if (!(event && event.hypeGesturePhase)) return;

		//gate ondrag
		config = config || {};
		
		// prep vars based on config
		var instance =  config.forceInstance || config.symbolInstance || hypeDocument.getSymbolInstance(element) || hypeDocument;
		var timelineName = config.timelineName || 'timelineName'; 
		var borderMode = config.borderMode || 'none';
		var ms = config.ms || 100;
		var maxVelocityTick =  (Math.abs(config.maxVelocity) || 12) / 60;
		var minVelocityTick =  config.minVelocity? Math.abs(config.minVelocity) / 60 : null;
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
					
					if (minVelocityTick) {
						if (instance.dragDiff>0) {
							if (instance.dragDiff<minVelocityTick) instance.dragDiff = minVelocityTick;
						} else if(instance.dragDiff<0){
							if (instance.dragDiff>-minVelocityTick) instance.dragDiff = -minVelocityTick;
						}
					}
					
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

	/**
	 * @typedef {Object} HypeSlideGesture
	 * @property {String} version Version of the extension
	 * @property {Function} continueAfterDrag continues the drag motion with custom settings
	 */
	var HypeSlideGesture = {
		version: '1.0.0',
		continueAfterDrag: continueAfterDrag,
	};

	/** 
	 * Reveal Public interface to window['HypeSlideGesture']
	 * return {HypeSlideGesture}
	 */
	return HypeSlideGesture;
	
})();
