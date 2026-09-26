console.log('CV. Content Script Initialized on:', window.location.href);

chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log('Content Script received message:', request);

    if (request.action === "GET_JD_TEXT") {
        let jdText = "";

        // LinkedIn specific extraction
        if (window.location.hostname.includes("linkedin.com")) {
            // 1. Try to click "See more" if it exists
            const showMoreBtn = document.querySelector('button.show-more-less-html__button--more, button[aria-label="Click to see more description"]') as HTMLElement;
            if (showMoreBtn) {
                try { showMoreBtn.click(); } catch (e) { console.error("Error clicking show more", e); }
            }

            // 2. Smart search: Find "About the job" header and get its container
            const allHeaders = Array.from(document.querySelectorAll('h2, h3, div, span'));
            const aboutHeader = allHeaders.find(el => el.textContent?.trim().toLowerCase() === 'about the job');
            
            if (aboutHeader && aboutHeader.parentElement) {
                // Usually the content is a sibling or inside a parent wrapper
                const container = aboutHeader.closest('article') || aboutHeader.closest('div[class*="description"]') || aboutHeader.parentElement.parentElement;
                if (container && container.innerText && container.innerText.trim().length > 100) {
                    jdText = container.innerText;
                }
            }

            // 3. Fallback to known selectors if Smart Search failed
            if (!jdText) {
                const selectors = [
                    'div.jobs-description-content__text',
                    'article.jobs-description__container',
                    'div.jobs-description__content',
                    '#job-details',
                    'div[class*="job-details"]',
                    '.jobs-search__job-details--container',
                    '.jobs-description',
                    '.jobs-box__html-content',
                    '.description__text',
                    'article', // ultimate fallback for right pane
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        if (el && el.innerText && el.innerText.trim().length > 100) {
                            jdText = el.innerText;
                            break;
                        }
                    }
                    if (jdText) break;
                }
            }
        }
        // Indeed specific extraction
        else if (window.location.hostname.includes("indeed.com")) {
            const description = document.querySelector('#jobDescriptionText') as HTMLElement;
            if (description) {
                jdText = description.innerText;
            }
        }

        // Generic fallback
        if (!jdText) {
            jdText = window.getSelection()?.toString() || "";
        }

        sendResponse({ text: jdText });
    }

    // Claude.ai paste handler with retry logic
    if (request.action === "PASTE_TO_CLAUDE") {
        const inputSelectors = [
            'div.ProseMirror[contenteditable="true"]',        // Claude's ProseMirror editor
            'fieldset div[contenteditable="true"]',
            'div[contenteditable="true"]',
        ];

        let tries = 0;
        const maxTries = 20;

        const interval = setInterval(() => {
            let inputEl: HTMLElement | null = null;
            for (const selector of inputSelectors) {
                inputEl = document.querySelector(selector) as HTMLElement;
                if (inputEl) break;
            }

            if (inputEl) {
                clearInterval(interval);
                inputEl.focus();

                try {
                    // Modern React/ProseMirror editors respond best to an actual paste event
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', request.text);

                    const pasteEvent = new ClipboardEvent('paste', {
                        bubbles: true,
                        cancelable: true,
                        clipboardData: dataTransfer
                    });

                    inputEl.dispatchEvent(pasteEvent);

                    // Fallback to execCommand if paste event didn't work
                    if (!inputEl.textContent?.includes(request.text.substring(0, 10))) {
                        document.execCommand('insertText', false, request.text);
                    }
                } catch (err) {
                    console.log('CV.dot: paste fallback', err);
                    inputEl.textContent = request.text;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }

                sendResponse({ success: true });
            } else if (tries >= maxTries) {
                clearInterval(interval);
                console.warn('CV.dot: Could not find Claude input box after retries');
                sendResponse({ success: false, error: 'Could not find Claude input box' });
            }

            tries++;
        }, 300); // Every 300ms, max 20 tries = 6 seconds
    }

    return true;
});

