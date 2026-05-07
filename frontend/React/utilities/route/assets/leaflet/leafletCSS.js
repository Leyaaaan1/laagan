// ─────────────────────────────────────────────
// leafletStyles.js
// Leaflet CSS exported as a JavaScript string
// ─────────────────────────────────────────────

const leafletCSS = `/* required styles */

.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
	position: absolute;
	left: 0;
	top: 0;
	}
.leaflet-container {
	overflow: hidden;
	}
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
	-webkit-user-select: none;
	   -moz-user-select: none;
	        user-select: none;
	  -webkit-user-drag: none;
	}
/* Prevents IE11 from highlighting tiles in blue */
.leaflet-tile::selection {
	background: transparent;
}
/* Safari renders non-retina tile on retina better with this, but Chrome is worse */
.leaflet-safari .leaflet-tile {
	image-rendering: -webkit-optimize-contrast;
	}
/* hack that prevents hw layers "stretching" when loading new tiles */
.leaflet-safari .leaflet-tile-container {
	width: 1600px;
	height: 1600px;
	-webkit-transform-origin: 0 0;
	}
.leaflet-marker-icon,
.leaflet-marker-shadow {
	display: block;
	}
/* .leaflet-container svg: reset svg max-width decleration shipped in Joomla! (joomla.org) 3.x */
/* .leaflet-container img: map is broken in FF if you have max-width: 100% on tiles */
.leaflet-container .leaflet-overlay-pane svg {
	max-width: none !important;
	max-height: none !important;
	}
.leaflet-container .leaflet-marker-pane img,
.leaflet-container .leaflet-shadow-pane img,
.leaflet-container .leaflet-tile-pane img,
.leaflet-container img.leaflet-image-layer,
.leaflet-container .leaflet-tile {
	max-width: none !important;
	max-height: none !important;
	width: auto;
	padding: 0;
	}

.leaflet-container img.leaflet-tile {
	/* See: https://bugs.chromium.org/p/chromium/issues/detail?id=600120 */
	mix-blend-mode: plus-lighter;
}

.leaflet-container.leaflet-touch-zoom {
	-ms-touch-action: pan-x pan-y;
	touch-action: pan-x pan-y;
	}
.leaflet-container.leaflet-touch-drag {
	-ms-touch-action: pinch-zoom;
	/* Fallback for FF which doesn't support pinch-zoom */
	touch-action: none;
	touch-action: pinch-zoom;
}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom {
	-ms-touch-action: none;
	touch-action: none;
}
.leaflet-container {
	-webkit-tap-highlight-color: transparent;
}
.leaflet-container a {
	-webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
}
.leaflet-tile {
	filter: inherit;
	visibility: hidden;
	}
.leaflet-tile-loaded {
	visibility: inherit;
	}
.leaflet-zoom-box {
	width: 0;
	height: 0;
	-moz-box-sizing: border-box;
	     box-sizing: border-box;
	z-index: 800;
	}
/* workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=888319 */
.leaflet-overlay-pane svg {
	-moz-user-select: none;
	}

.leaflet-pane         { z-index: 400; }

.leaflet-tile-pane    { z-index: 200; }
.leaflet-overlay-pane { z-index: 400; }
.leaflet-shadow-pane  { z-index: 500; }
.leaflet-marker-pane  { z-index: 600; }
.leaflet-tooltip-pane   { z-index: 650; }
.leaflet-popup-pane   { z-index: 700; }

.leaflet-map-pane canvas { z-index: 100; }
.leaflet-map-pane svg    { z-index: 200; }

.leaflet-vml-shape {
	width: 1px;
	height: 1px;
	}
.lvml {
	behavior: url(#default#VML);
	display: inline-block;
	position: absolute;
	}


/* control positioning */

.leaflet-control {
	position: relative;
	z-index: 800;
	pointer-events: visiblePainted;
	pointer-events: auto;
	}
.leaflet-top,
.leaflet-bottom {
	position: absolute;
	z-index: 1000;
	pointer-events: none;
	}
.leaflet-top {
	top: 0;
	}
.leaflet-right {
	right: 0;
	}
.leaflet-bottom {
	bottom: 0;
	}
.leaflet-left {
	left: 0;
	}
.leaflet-control {
	float: left;
	clear: both;
	}
.leaflet-right .leaflet-control {
	float: right;
	}
.leaflet-top .leaflet-control {
	margin-top: 10px;
	}
.leaflet-bottom .leaflet-control {
	margin-bottom: 10px;
	}
.leaflet-left .leaflet-control {
	margin-left: 10px;
	}
.leaflet-right .leaflet-control {
	margin-right: 10px;
	}

/* layers control */

.leaflet-control-layers {
	box-shadow: 0 1px 5px rgba(0,0,0,0.4);
	background: #fff;
	border-radius: 5px;
	}
.leaflet-control-layers-toggle {
	background-image: url(data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAaABoDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAABggJBwD/xAAwEAABAwIEBQIDCQAAAAAAAAABAgMEBREABiExBxJBUWETFAhSgRUWIiQyQnGRsf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwBXsi5Br+bXUriMe3g3suW8CEDuE9VHwPqRhjMr/D3Tfuo8ldGXOLibqkvq5Hl+Wx+0Dxv5wb8CGqcvKdPq3u4WZilpIc9sz6RjKA2S2TZdtr6ag2HQbTEqEKVDMtiS2plN+dRNuS24UD+kjscBPTiJwgreXXHpNLQ9UYSCedHJZ9m3zJ627j+hjMyLGxxSPPP2XWoDslCWojTSSTVnE2AA+RO7n107XwmFZqiBWJobzll59HuHOVwU0jnHMbK2O++5/k4Ay4TceY8diHRs2RksIjpDcadESEFoAWAIGw0Hje+mmGKg1eDVYKaoyin1RspCkzg4EN2AuC6nqQNR/icTuwX5YqNQYyNX2mJ0pptPpWQh1QAurXQHrgGK4r8dKNQH3YtJcFcrSLp9XZiOdvwjYde50F7g4XGdn2uzJr8t5unF19xTi/yaN1G56ecCmOwH/9k=);
	width: 36px;
	height: 36px;
}
.leaflet-retina .leaflet-control-layers-toggle {
	background-image: url(data:image/png;base64,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);
	background-size: 26px 26px;
	}

/* Default icon URLs */
.leaflet-default-icon-path {
	background-image: url(data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAApABkDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAABwgABgECBAP/xAA1EAABAgUBBQUECwAAAAAAAAABAgMABAUGESEHEjFBkRMUMmGBIlFUoRUWIzM1QnFzstHw/8QAFgEBAQEAAAAAAAAAAAAAAAAABAYF/8QAIREAAgEEAQUBAAAAAAAAAAAAAQIEAAMFERITITFB0fD/2gAMAwEAAhEDEQA/AALsg2aNXDLCuV1bjdOC8NMJ0U/jiSeSeX+1NLNm2i3LBlFrU4tAYyZcEnzJ5xm3EMStCpkrLELYalUBvHBQxpDNWnYlmzViyK3qdKzapqUQ65PK+9KlJBKkr4oAPAAgDEVDLYx1pOS7JqUUyMlebi2gKRHazsrkpWnP162UrbSyN5+S4gJ5qT/XTzC0OdNFvtXGkuhxpQUntBoFJ1G96jWAd9VbV+Ma6QfIY1Swe123Scdk2CFLuzqrfsirwq9kyqFLHeZD7Bwc8DwnpjXzi+NV6ptU5dOaqM63JOZ35ZEy4llWeOUA7pzz015ws+ye4jQLobS8vEnOYZeGdBnwq9CfnB8Kj2m4n2s+HHPPCNjEXUlxwrjZX9usrLWHiSCUOg37Vct7V9NDtafqa1JLvZltlJ/MtWgGPWFl77N/EOdYvu2+4vpCtN0WWc3paR8eDopw8egPzPugdRPZiX1pBVfC9vtUGHidGPyby3f5Ugz0K+mk7OXKjMub1Rkk92CSdVrI9g+o4/ofdAYjpb/C3/3m/wCK4JDmXIrMU9gimTIluSqh/RBrxfdcfeW88srccUVLUeJJOSY0iRIHS6//2Q==);
}

/* popup */

.leaflet-popup {
	position: absolute;
	text-align: center;
	margin-bottom: 20px;
	}
.leaflet-popup-content-wrapper {
	padding: 1px;
	text-align: left;
	border-radius: 12px;
	}
.leaflet-popup-content {
	margin: 13px 24px 13px 20px;
	line-height: 1.3;
	font-size: 13px;
	min-height: 1px;
	}
.leaflet-popup-content p {
	margin: 17px 0;
	}
.leaflet-popup-tip-container {
	width: 40px;
	height: 20px;
	position: absolute;
	left: 50%;
	margin-top: -1px;
	margin-left: -20px;
	overflow: hidden;
	pointer-events: none;
	}
.leaflet-popup-tip {
	width: 17px;
	height: 17px;
	padding: 1px;
	margin: -10px auto 0;
	pointer-events: auto;
	-webkit-transform: rotate(45deg);
	   -moz-transform: rotate(45deg);
	    -ms-transform: rotate(45deg);
	        transform: rotate(45deg);
	}
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
	background: white;
	color: #333;
	box-shadow: 0 3px 14px rgba(0,0,0,0.4);
	}
.leaflet-container a.leaflet-popup-close-button {
	position: absolute;
	top: 0;
	right: 0;
	border: none;
	text-align: center;
	width: 24px;
	height: 24px;
	font: 16px/24px Tahoma, Verdana, sans-serif;
	color: #757575;
	text-decoration: none;
	background: transparent;
	}

/* Tooltip */
.leaflet-tooltip {
	position: absolute;
	padding: 6px;
	background-color: #fff;
	border: 1px solid #fff;
	border-radius: 3px;
	color: #222;
	white-space: nowrap;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	pointer-events: none;
	box-shadow: 0 1px 3px rgba(0,0,0,0.4);
	}
.leaflet-tooltip.leaflet-interactive {
	cursor: pointer;
	pointer-events: auto;
	}`;

export default leafletCSS;
