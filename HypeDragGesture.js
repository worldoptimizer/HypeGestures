/*!
Hype Drag Gesture 1.0.0
copyright (c) 2021 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/*
* Version-History
* 1.0.0	Initial release under MIT-license

*/
if("HypeDragGesture" in window === false) window['HypeDragGesture'] = (function () {

    /**
     * This function is to be called in an "On Drag" action.
     *
     * @param {String} hypeDocument forward the API
     * @param {HTMLDivElement} element forward the element
     * @param {Object} event forward the event
     */
    function onDrag (hypeDocument, element, event){

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

	/**
	 * @typedef {Object} HypeDragGesture
	 * @property {String} version Version of the extension
	 * @property {Function} sample Boilerplate text
	 */
	var HypeDragGesture = {
		version: '1.0.0',
		onDrag: onDrag,
	};

	/** 
	 * Reveal Public interface to window['HypeDragGesture']
	 * return {HypeDragGesture}
	 */
	return HypeDragGesture;
	
})();
