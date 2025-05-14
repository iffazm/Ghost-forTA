import Component from '@glimmer/component';
import {action} from '@ember/object';

export default class ModalPostPreviewBrowserComponent extends Component {
    @action
    setupIframe(event) {
        const iframe = event.target;

        // Set up message event listener on the parent window
        const messageHandler = (e) => {
            // Check if the message is from our iframe and has the expected format
            if (e.source === iframe.contentWindow && e.data && e.data.type === 'escape-keydown') {
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
        };
        
        window.addEventListener('message', messageHandler);

        // Inject a script into the iframe to send messages back when it loads
        iframe.addEventListener('load', () => {
            // Try to access the iframe content - this will throw an error if cross-origin
            try {
                // Make sure we have a contentWindow before proceeding
                if (!iframe.contentWindow) {
                    return;
                }
                
                // Attempt to inject script directly into same-origin iframe
                const script = document.createElement('script');
                script.textContent = `
                    window.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            window.parent.postMessage({type: 'escape-keydown'}, '*');
                        }
                    });
                `;
                
                iframe.contentDocument.body.appendChild(script);
            } catch (error) {
                // For cross-origin iframes, we can't inject directly
                // Ghost will need to include the message-sending code in the rendered preview page
            }
        });
    }
}
