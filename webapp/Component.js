sap.ui.define([
	"sap/ui/core/Component",
	"sap/ui/Device",
	"./objects/Flake"
], function (Component, Device, Flake) {

	return Component.extend("be.swolfs.ch.heart.Component", {

		metadata: {
			"manifest": "json"
		},

		init: function () {
			//var rendererPromise = this._getRenderer();

			// define heart variables
			this._lastTime = null;
			this._removespeed = 45;
			this._numFlakes = 200;
			this._j = this._numFlakes;
			this._windowW = Device.resize.width; //window.innerWidth;
			this._windowH = Device.resize.height; //window.innerHeight;
			this._flakes = [];
			this._canvas = null;

			// get canvas to paint in: there seems to be only one in 
			// in the Fiori Launchpad so this should always work
			this._canvas = $("canvas").get(0);
			if (!this._canvas) {
				// stop processing in case we don't have a canvas!
				return;
			}
			this._ctx = this._canvas.getContext("2d");

			// first loop to create all Flake objects
			var i = this._numFlakes,
				flake, x, y;
			while (i--) {
				// create new flake
				flake = new Flake();
				// get random location
				x = flake.randomBetween(0, this._windowW, true);
				y = flake.randomBetween(0, this._windowH, true);
				flake.init(x, y);
				// add flake
				this._flakes.push(flake);
			}
			// start looping all flakes to move them
			this.loop();
		},
		loop: function (timestamp) {
			timestamp = timestamp || 0;
			if (!this._lastTime) this._lastTime = timestamp;
			var elapsed = timestamp - this._lastTime;

			var i = this._flakes.length,
				flakeA;

			//diminish the amount of flakes
			i = this._j;
			if (elapsed > this._removespeed) {
				this._j = this._j - 1;
				this._lastTime = timestamp;
			}

			// clear canvas
			this._ctx.save();
			this._ctx.setTransform(1, 0, 0, 1, 0, 0);
			this._ctx.clearRect(0, 0, this._windowW, this._windowH);
			this._ctx.restore();

			// loop through the flakes and "animate" them
			while (i--) {
				flakeA = this._flakes[i];
				flakeA.update();

				this._ctx.beginPath();
				// this._ctx.arc(flakeA.x, flakeA.y, flakeA.weight, 0, 2 * Math.PI, false);
				this._drawHeart(flakeA.x, flakeA.y, flakeA.weight, flakeA.weight, 10, 10, 'red');

				this._ctx.fillStyle = "rgba(255, 255, 255, " + flakeA.alpha + ")";
				this._ctx.fill();

				this._ctx.fillStyle = "rgba(255, 255, 255, " + flakeA.alpha + ")";
				this._ctx.fill();

				if (flakeA.y >= this._windowH) {
					flakeA.y = -flakeA.weight;
				}
			}
			// continue animation...
			// console.log(timestamp);
			if (timestamp < 20000) {
				requestAnimationFrame(this.loop.bind(this));
			} else {
				this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
			}
		},

		_drawHeart: function (fromx, fromy, tox, toy, lw, hlen, color) {

			var x = fromx;
			var y = fromy;
			var width = lw;
			var height = hlen;

			this._ctx.save();
			this._ctx.beginPath();
			var topCurveHeight = height * 0.3;
			this._ctx.moveTo(x, y + topCurveHeight);
			// top left curve
			this._ctx.bezierCurveTo(
				x, y,
				x - width / 2, y,
				x - width / 2, y + topCurveHeight
			);

			// bottom left curve
			this._ctx.bezierCurveTo(
				x - width / 2, y + (height + topCurveHeight) / 2,
				x, y + (height + topCurveHeight) / 2,
				x, y + height
			);

			// bottom right curve
			this._ctx.bezierCurveTo(
				x, y + (height + topCurveHeight) / 2,
				x + width / 2, y + (height + topCurveHeight) / 2,
				x + width / 2, y + topCurveHeight
			);

			// top right curve
			this._ctx.bezierCurveTo(
				x + width / 2, y,
				x, y,
				x, y + topCurveHeight
			);

			this._ctx.closePath();
			this._ctx.fillStyle = color;
			this._ctx.fill();
			this._ctx.restore();

		},

		/**
		 * Returns the shell renderer instance in a reliable way,
		 * i.e. independent from the initialization time of the plug-in.
		 * This means that the current renderer is returned immediately, if it
		 * is already created (plug-in is loaded after renderer creation) or it
		 * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
		 * before the renderer is created).
		 *
		 *  @returns {object}
		 *      a jQuery promise, resolved with the renderer instance, or
		 *      rejected with an error message.
		 */
		_getRenderer: function () {
			var that = this,
				oDeferred = new jQuery.Deferred(),
				oRenderer;

			that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
			if (!that._oShellContainer) {
				oDeferred.reject(
					"Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
			} else {
				oRenderer = that._oShellContainer.getRenderer();
				if (oRenderer) {
					oDeferred.resolve(oRenderer);
				} else {
					// renderer not initialized yet, listen to rendererCreated event
					that._onRendererCreated = function (oEvent) {
						oRenderer = oEvent.getParameter("renderer");
						if (oRenderer) {
							oDeferred.resolve(oRenderer);
						} else {
							oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
						}
					};
					that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
				}
			}
			return oDeferred.promise();
		}
	});
});