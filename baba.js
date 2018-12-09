window.botScriptVersion = 2.4;
if (window.scriptVersion !== window.botScriptVersion) alert('Please update your script! you are using an old version! There may be some problems when trying to play!');
window.agarServer = 'none';
window.started = false;
window.__connected = 'Disconnected';
window.pelletMode = false;
window._ws = null;
window.wobsocket = null;
window._boarders = {};
window.boarders = {};
var mapWidth = 200;
(function() {
	'use strict';
	function bufToArray(buf) {
		var ab = [];
		for (var i = 0; i < buf.byteLength; i++) {
			ab.push(buf.getUint8(i, true));
		}
		return ab;
	}
	function toArrayBuffer(buf) {
		var ab = new ArrayBuffer(buf.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buf.length; ++i) {
			view[i] = buf[i];
		}
		return ab;
	}
	//console.log('Calling connect function');
	connect();
	function connect() {
		//console.log('Connecting!');
		window._ws = new WebSocket('wss://' + 'clonesmasher.com' + ':8888?origin=' + location.origin + '&token=' + Math.floor(Math.random() * 100000));
		window._ws.binaryType = 'arraybuffer';
		window._ws.onclose = onclose;
		window._ws.onopen = onopen;
		window._ws._send = window._ws.send;
		window._ws.send = send;
		window._ws.onmessage = onmessage;
	}
	function onmessage(msg) {
		//  console.log(msg.data);
		let buffer = new DataView(msg.data);
		let offset = 0;
		switch (buffer.getUint8(offset++)) {
			case 0:
				let count = buffer.getUint16(offset, true) + '/' + buffer.getUint16(offset + 2, true) + '/' + buffer.getUint32(offset + 4, true);
				$('#count').html(count);
				break;
			case 1:
				let _timeLeft = '';
				window.oof = buffer;
				for (; offset < buffer.byteLength; offset++) {
					_timeLeft += buffer.getUint8(offset).toString();
				}
				console.log(_timeLeft);
				_timeLeft = parseInt(_timeLeft);
				timeLeft(_timeLeft);
				break;
		}
	}
	function timeLeft(timeleft) {
		if (timeleft == 'unlimited') $('#timeLeft').html('Lifetime');
		else
			setInterval(() => {
				var seconds = parseInt(timeleft--);
				var days = Math.floor(seconds / (3600 * 24));
				seconds -= days * 3600 * 24;
				var hrs = Math.floor(seconds / 3600);
				seconds -= hrs * 3600;
				var mnts = Math.floor(seconds / 60);
				seconds -= mnts * 60;

				if (days == 0) $('#timeLeft').html(`${hrs}H ${mnts}M ${seconds}S`);
				else $('#timeLeft').html(`${days}D ${hrs}H ${mnts}M`);
			}, 1000);
	}
	function onopen() {
		//console.log('Connected!');
		$('#serverStat').html('Connected');
		window.__connected = 'Connected';
		$('#serverStat').removeClass('label-danger');
		$('#serverStat').addClass('label-success');
		let buf = new DataView(new ArrayBuffer(1 + 2 * window.agarServer.length));
		let offset = 0;
		buf.setUint8(offset++, 3);
		for (let i = 0; i < window.agarServer.length; i++) {
			buf.setUint16(offset, window.agarServer.charCodeAt(i), true);
			offset += 2;
		}
		window._ws.send(buf);
	}
	function send(e) {
		if (window._ws.readyState === window._ws.OPEN) window._ws._send(e);
	}
	function onclose(e) {
		if (window._ws.tokenInt) clearInterval(window._ws.tokenInt);
		$('#serverStat').html('Disconnected');
		window.__connected = 'Disconnected';
		$('#serverStat').removeClass('label-success');
		$('#serverStat').addClass('label-danger');
		//console.log('Closed! reason: ' + e.reason);
		if (e.reason !== 'FULL') connect();
	}
	if (window.location.origin == 'http://alis.io') {
		setInterval(() => {
			var _pkt = new DataView(new ArrayBuffer(13));
			_pkt.setUint8(0, 16);
			_pkt.setInt32(1, getCurrentX(), true);
			_pkt.setInt32(5, getCurrentY(), true);
			_pkt.setUint32(9, 0, true);
			window._ws.send(_pkt);
		}, 50);
		setInterval(() => {
			if (!window.webSocket) return;
			if (window.webSocket.url == window.agarServer) return;
			window.agarServer = window.webSocket.url;
			let buf = new DataView(new ArrayBuffer(1 + 2 * window.agarServer.length));
			let offset = 0;
			buf.setUint8(offset++, 3);
			for (let i = 0; i < window.agarServer.length; i++) {
				buf.setUint16(offset, window.agarServer.charCodeAt(i), true);
				offset += 2;
			}
			window._ws.send(buf);
		}, 2500);
	} else if (window.location.origin == 'http://agar.bio') {
		window.WebSocket.prototype.realSend = window.WebSocket.prototype.send;
		window.WebSocket.prototype.send = function(pkt) {
			this.realSend(pkt);
			if (this.url.indexOf(window.botConfig.botServer) !== -1) return;
			if (pkt instanceof ArrayBuffer) pkt = new DataView(pkt);
			else if (pkt instanceof DataView) pkt = pkt;
			else pkt = new DataView(toArrayBuffer(pkt));
			switch (pkt.getUint8(0, true)) {
				case 16:
					window._ws.send(pkt);
					break;
				case 254:
					if (window.pkt254) return;
					// console.log(bufToArray(pkt));
					window.pkt254 = bufToArray(pkt);
					var buf = new DataView(new ArrayBuffer(1 + pkt.byteLength));
					buf.setUint8(0, 254);
					buf.setUint8(1, pkt.getUint8(0));
					//buf.setUint32(pkt.getUint32(1, true), true);
					for (var i = 0; i < pkt.byteLength; i++) {
						buf.setUint8(i + 1, pkt.getUint8(i));
					}
					window._ws.send(buf);
					break;
				case 255:
					if (window.pkt255) return;
					window.pkt255 = bufToArray(pkt);
					//console.log(bufToArray(pkt));
					buf = new DataView(new ArrayBuffer(1 + pkt.byteLength));
					buf.setUint8(0, 255);
					buf.setUint8(1, pkt.getUint8(0));
					//buf.setUint32(pkt.getUint32(1, true), true);
					for (var i = 0; i < pkt.byteLength; i++) {
						buf.setUint8(i + 1, pkt.getUint8(i));
					}
					window._ws.send(buf);
					break;
				default:
				//console.log(bufToArray(pkt));
			}
			if (window.agarServer !== this.url) {
				window.agarServer = this.url;
				let buf = new DataView(new ArrayBuffer(1 + 2 * this.url.length));
				let offset = 0;
				buf.setUint8(offset++, 3);
				for (let i = 0; i < this.url.length; i++) {
					buf.setUint16(offset, this.url.charCodeAt(i), true);
					offset += 2;
				}
				window._ws.send(buf);
			}
		};
	} else {
		WebSocket.prototype.realSend = WebSocket.prototype.send;
		WebSocket.prototype.send = function(pkt) {
			this.realSend(pkt);
			if (this.url.indexOf(window.botConfig.botServer) !== -1) return;
			if (pkt instanceof ArrayBuffer) pkt = new DataView(pkt);
			else if (pkt instanceof DataView) pkt = pkt;
			else pkt = new DataView(toArrayBuffer(pkt));
			//if (location.origin.indexOf('biome3d.com') != -1 && pkt.getUint8(0, true) == 1)
			//pkt.setUint8(0, 16);
			switch (pkt.getUint8(0, true)) {
				case 16:
					window._ws.send(pkt);
					break;
				case 254:
					// console.log(bufToArray(pkt));
					if (window.pkt254) return;
					window.pkt254 = bufToArray(pkt);
					var buf = new DataView(new ArrayBuffer(1 + pkt.byteLength));
					buf.setUint8(0, 254);
					buf.setUint8(1, pkt.getUint8(0));
					//buf.setUint32(pkt.getUint32(1, true), true);
					for (var i = 0; i < pkt.byteLength; i++) {
						buf.setUint8(i + 1, pkt.getUint8(i));
					}
					window._ws.send(buf);
					break;
				case 255:
					if (window.pkt255) return;
					window.pkt255 = bufToArray(pkt);
					//console.log(bufToArray(pkt));
					buf = new DataView(new ArrayBuffer(1 + pkt.byteLength));
					buf.setUint8(0, 255);
					buf.setUint8(1, pkt.getUint8(0));
					//buf.setUint32(pkt.getUint32(1, true), true);
					for (var i = 0; i < pkt.byteLength; i++) {
						buf.setUint8(i + 1, pkt.getUint8(i));
					}
					window._ws.send(buf);
					break;
				default:
					if (window.cloneSmasherDebug) console.log(bufToArray(pkt));
			}
			if (window.agarServer !== this.url) {
				window.agarServer = this.url;
				let buf = new DataView(new ArrayBuffer(1 + 2 * this.url.length));
				let offset = 0;
				buf.setUint8(offset++, 3);
				for (let i = 0; i < this.url.length; i++) {
					buf.setUint16(offset, this.url.charCodeAt(i), true);
					offset += 2;
				}
				window._ws.send(buf);
			}
		};
		var _WebSocket = WebSocket;
		WebSocket = function(ip) {
			if (ip.indexOf(window.botConfig.botServer) == -1) {
				window.agarServer = ip;
				let buf = new DataView(new ArrayBuffer(1 + 2 * ip.length));
				let offset = 0;
				buf.setUint8(offset++, 3);
				for (let i = 0; i < ip.length; i++) {
					buf.setUint16(offset, ip.charCodeAt(i), true);
					offset += 2;
				}
				window._ws.send(buf);
				window.wobsocket = new _WebSocket(ip);
				if (location.origin == 'http://agar.pro' || location.origin == 'http://qwoks.ga' || location.origin == 'http://agar.red') overWriteWS();
				return window.wobsocket;
			} else return new _WebSocket(ip);
		};
	}
	function isTyping() {
		return $('input:focus').length;
	}
	document.addEventListener('keyup', event => {
		if (!event.key) return;
		const key = event.key.toLowerCase();
		if (isTyping() || event.ctrlKey) return;
		switch (key) {
			case window.botConfig.botSendMessage.toLowerCase():
				var msg = prompt('What do you want the bots to say?', '');
				if (!msg) break;
				var buf = new DataView(new ArrayBuffer(1 + 2 * msg.length));
				var offset = 0;
				buf.setUint8(offset++, 99);
				for (var i = 0; i < msg.length; i++) {
					buf.setUint16(offset, msg.charCodeAt(i), true);
					offset += 2;
				}
				window._ws.send(buf);
				break;
			case window.botConfig.botMassGate.toLowerCase():
				window._ws.send(new Uint8Array([5]));
				break;
			case window.botConfig.botPelletMode.toLowerCase():
				window._ws.send(new Uint8Array([4]));
				break;
			case window.botConfig.hideUI.toLowerCase():
				$('#b0Tmenu').toggle();
				break;
			case window.botConfig.botStart.toLowerCase():
				if (window.started) window._ws.send(new Uint8Array([1]));
				else window._ws.send(new Uint8Array([0]));
				window.started = !window.started;
				break;
		}
	});
	document.addEventListener('keydown', event => {
		if (!event.key) return;
		const key = event.key.toLowerCase();
		if (isTyping() || event.ctrlKey) return;
		switch (key) {
			case window.botConfig.botSplit.toLowerCase():
				window._ws.send(new Uint8Array([2, 0]));
				break;
			case window.botConfig.botFeed.toLowerCase():
				window._ws.send(new Uint8Array([2, 1]));
				break;
		}
	});

	function createIframe() {
		let cloneSmasherSettingsElement = document.createElement('iframe');
		cloneSmasherSettingsElement.src = 'https://clonesmasher.com/settingsSave';
		cloneSmasherSettingsElement.style = 'display:none;';
		cloneSmasherSettingsElement.id = 'cloneSmasherSettings';
		document.body.appendChild(cloneSmasherSettingsElement);
		window.cloneSmasherSettings = document.getElementById('cloneSmasherSettings').contentWindow;
		window.updateKey = (func, key) => {
			document.getElementById(func).innerText = key.toUpperCase();
			window.botConfig[func] = key.toUpperCase();
		};
		window.updateUIPos = (top, left) => {
			const json = {};
			json.type = 'uiPos';
			json.top = top;
			json.left = left;
			window.cloneSmasherSettings.postMessage(json, 'https://clonesmasher.com');
		};
		window.addEventListener('message', data => {
			if (data.origin != 'https://clonesmasher.com') return;
			const message = data.data;
			switch (message.type) {
				case 'set':
					window.updateKey(message.function, message.key);
					break;
				case 'setup':
					const _elements = ['botSplit', 'botFeed', 'hideUI', 'botSendMessage'];
					for (let element of _elements) {
						document.getElementById(element).onclick = () => {
							const key = prompt(`What key do you want to change '${element == 'botSendMessage' ? 'chatSpam' : element}' to?`, document.getElementById(element).innerText);
							if (!key) return;
							document.getElementById(element).innerText = key[0].toUpperCase();
							const json = {};
							json.type = 'set';
							json.function = element;
							json.key = key[0].toUpperCase();
							window.botConfig[element] = key[0].toUpperCase();
							window.cloneSmasherSettings.postMessage(json, 'https://clonesmasher.com');
						};
					}
					const setup = {};
					setup.type = 'setup';
					setup.botConfig = window.botConfig;
					window.cloneSmasherSettings.postMessage(setup, 'https://clonesmasher.com');
					break;
				case 'uiPos':
					let intereee = setInterval(() => {
						if (document.getElementById('_botUI')) {
							clearInterval(intereee);
							document.getElementById('_botUI').style.left = message.left + 'px';
							document.getElementById('_botUI').style.top = message.top + 'px';
						}
					});
					break;
			}
		});
	}
	function addBotUi() {
		var html = `<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet"><div id="_botUI" style='z-index: 10000000; position: absolute; left: 20px; top: 20px;> <div id='botlayersub'>
<div id="b0Tmenu">
<div class='panel panel-default overview'>
   <div class='panel-body'>
      <ul class='list-unstyled'>
         <li class='headline'>
            <center><u><b>CloneSmasher.com</b></u></center>
         </li>
		 <div style='display: inline;'>Server Status: </div><span id='serverStat' class='label ${window.__connected == 'Connected' ? 'label-success' : 'label-danger'} pull-right'>${window.__connected}</span><br>
         <div style='display: inline;'>Bots: </div>
            <div style='display: inline;'><span id='count' class='label label-info pull-right'>Waiting</span></div>
         <li>Time left:<span class='label label-warning pull-right'>99999 Seconds</span></li>
      </ul>
   </div>
</div>



<div class='panel panel-default controls'>
	<div class='panel-body'>
		<ul class='list-unstyled'>
			<button id="start" class="btn btn-success">Start Bots</button><br><br>
			<button onclick="$('#botControls').toggle()" class="btn btn-success">Toggle Controls</button>
			</ul>
	</div>
</div>


<div class='panel panel-default controls' id='botControls'>
<div class='panel-body'>
<ul class='list-unstyled'>
<li class='mouse'>Hide/Show UI<span id='hideUI' class='badge pull-right'>${window.botConfig.hideUI.toUpperCase()}</span></li>
<li class='mouse'>Split Bots<span id='botSplit' class='badge pull-right'>${window.botConfig.botSplit.toUpperCase()}</span></li>
<li class='mouse'>Bot Feed <span id='botFeed' class='badge pull-right'>${window.botConfig.botFeed.toUpperCase()}</span></li>
<li class='mouse'>Chat Spam<span id='botSendMessage' class='badge pull-right'>${window.botConfig.botSendMessage.toUpperCase()}</span></li></div></div></div>`;
		//<li class='mouse'>Collect Pellets<span id='botlayer-key-e' class='badge pull-right'>${window.botConfig.botPelletMode.toUpperCase()}</span></li>
		$('body').append(html);
		$( "#_botUI" ).draggable({
			drag: function(event, ui) {
				window.updateUIPos(ui.position.top, ui.position.left);
			}
		});
		if (window.__connected == 'Connected') {
			$('#serverStat').html('Connected');
			$('#serverStat').removeClass('label-danger');
			$('#serverStat').addClass('label-success');
		} else {
			$('#serverStat').html('Connected');
			$('#serverStat').removeClass('label-success');
			$('#serverStat').addClass('label-danger');
		}
		document.getElementById('start').onclick = () => {
			if (window.started) {
				window._ws.send(new Uint8Array([1]));
				$('#start').removeClass('btn-danger');
				$('#start').addClass('btn-success');
				$('#start').html('Start Bots');
			} else {
				window._ws.send(new Uint8Array([0]));
				$('#start').removeClass('btn-success');
				$('#start').addClass('btn-danger');
				$('#start').html('Stop Bots');
			}
			window.started = !window.started;
			$('#start').blur();
		};
		createIframe();
	}
	function addUis() {
		if (location.origin == 'https://popsplit.us' || /http\:\/\/.+?biome3d\.com/g.test(location.origin)) setTimeout(addBotUi, 2500);
		else addBotUi();
	}
	addUis();
	function overWriteWS() {
		setTimeout(() => {
			console.log('overwrite ws onmessage!');
			window.wobsocket.___msg = window.wobsocket.onmessage;
			window.wobsocket.onmessage = function(msg) {
				window.wobsocket.___msg(msg);
				msg = new DataView(msg.data);
				let opcode = msg.getUint8(0);
				switch (opcode) {
					case 64:
						window._boarders.x = (msg.getFloat64(1, true) + msg.getFloat64(17, true)) / 2;
						window._boarders.y = (msg.getFloat64(9, true) + msg.getFloat64(25, true)) / 2;
						window._ws.send(msg);
						break;
				}
			};
		}, 500);
	}
})();