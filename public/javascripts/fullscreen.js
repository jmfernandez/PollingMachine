var fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.documentElement.webkitRequestFullScreen || document.msFullscreenEnabled;

function requestFullscreen(element) {
    if (element.requestFullscreen) {
	element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
	element.parentElement.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
	element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.webkitRequestFullscreen) {
	element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.msRequestFullscreen) {
	element.msRequestFullscreen();
    }
}
