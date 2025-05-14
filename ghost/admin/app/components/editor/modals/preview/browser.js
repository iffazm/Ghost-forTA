import Component from '@glimmer/component';
import {action} from '@ember/object';

export default class ModalPostPreviewBrowserComponent extends Component {
    @action
    setupIframe(event) {
        const iframe = event.target;

        // Set up message event listener on the parent window
        window.addEventListener('message', (e) => {
            // Verify the message is from our iframe
            if (e.source === iframe.contentWindow && e.data.type === 'escape-keydown') {
                // Create and dispatch a new ESC key event to the parent window
                const escEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true,
                    composed: true
                });

                // Dispatch the event on the document instead of window
                document.dispatchEvent(escEvent);
            }
        });

        // Inject a script into the iframe to send messages back
        iframe.addEventListener('load', () => {
            try {
                // Try to inject script that will send postMessage on Escape
                const script = `
                    window.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            window.parent.postMessage({ type: 'escape-keydown' }, '*');
                        }
                    });
                `;
                
                // This will only work if same-origin, but we try anyway
                // and fall back to the message approach if it fails
                const scriptElem = iframe.contentDocument.createElement('script');
                scriptElem.textContent = script;
                iframe.contentDocument.body.appendChild(scriptElem);
            } catch (error) {
                // If we can't inject directly due to CORS, we rely solely on the iframe 
                // content to send messages if it has our handler code
            }
        });
    }
}
