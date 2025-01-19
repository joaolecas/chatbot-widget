(function () {
    // 1) Create a unique container and attach it to the body
    const container = document.createElement('div');
    container.id = 'my-chatbot-container';
    document.body.appendChild(container);
  
    // 2) Create a Shadow Root so local WP theme won't affect our styles
    const shadow = container.attachShadow({ mode: 'open' });
  
    // 3) Option A: Fetch external HTML & CSS (already deployed on Vercel)
    const cssUrl = 'https://chatbot-widget-six.vercel.app/chatbot-widget.css';
    const htmlUrl = 'https://chatbot-widget-six.vercel.app/chatbot-widget.html';
  
    // or Option B: Inline your CSS & HTML as strings (longer file, but no extra fetch)
  
    // 4) Load the CSS & HTML, then inject them into the Shadow DOM
    Promise.all([
      fetch(cssUrl).then(r => r.text()),
      fetch(htmlUrl).then(r => r.text()),
    ])
    .then(([rawCss, rawHtml]) => {
      // Create a <style> with the fetched CSS
      const styleEl = document.createElement('style');
      styleEl.textContent = rawCss;
  
      // Create a wrapper for your chatbot HTML
      const wrapper = document.createElement('div');
      wrapper.innerHTML = rawHtml;
      
      // Attach both to shadow root
      shadow.appendChild(styleEl);
      shadow.appendChild(wrapper);
  
      // 5) Now run the logic that you originally had in your IIFE.
      //    BUT we must query elements from shadow, not document!
      initializeChatbot(shadow);
    })
    .catch(err => console.error('Error loading resources:', err));
  
    // This function replicates the logic from your existing code,
    // but references everything inside the shadow root instead of the main document.
    function initializeChatbot(shadowRoot) {
      // Grab elements from inside the shadow
      const chatbotToggler = shadowRoot.querySelector('.chatbot-toggler');
      const closeBtn       = shadowRoot.querySelector('.close-btn');
      const chatbox        = shadowRoot.querySelector('.chatbox');
      const chatInput      = shadowRoot.querySelector('.chat-input textarea');
      const sendChatBtn    = shadowRoot.querySelector('.chat-input span');
  
      let userMessage = null;
      const inputInitHeight = chatInput.scrollHeight;
  
      // Create chat <li> element
      const createChatLi = (message, className) => {
        const chatLi = document.createElement('li');
        chatLi.classList.add('chat', className);
  
        // If the message is incoming (from the chatbot), add an avatar image
        let chatContent = (className === 'outgoing')
          ? `<p></p>` 
          : `<img src="https://chatbot-widget-six.vercel.app/avatar.png" alt="Avatar" class="chat-avatar"><p></p>`;
  
        chatLi.innerHTML = chatContent;
        chatLi.querySelector('p').textContent = message;
        return chatLi;
      };
  
      // Send message to your Flask server, get reply
      const generateResponse = (chatElement, userMessage) => {
        const API_URL = 'https://server-l6cq.onrender.com/chat'; // your Flask route
        const messageElement = chatElement.querySelector('p');
        const threadId = sessionStorage.getItem('threadId');
  
        if (!threadId) {
          console.error('Thread ID is missing. Cannot send message.');
          return;
        }
  
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thread_id: threadId,
            message: userMessage,
          })
        };
  
        fetch(API_URL, requestOptions)
          .then(res => res.json())
          .then(data => {
            messageElement.textContent = data.response;
          })
          .catch(() => {
            messageElement.classList.add('error');
            messageElement.textContent = 'Oops! Something went wrong. Please try again.';
          })
          .finally(() => chatElement.scrollTo(0, chatElement.scrollHeight));
      };
  
      // Handle user sending chat
      const handleChat = () => {
        userMessage = chatInput.value.trim();
        if (!userMessage) return;
  
        // Clear textarea
        chatInput.value = '';
        chatInput.style.height = `${inputInitHeight}px`;
  
        // Append user message
        chatbox.appendChild(createChatLi(userMessage, 'outgoing'));
        chatbox.scrollTo(0, chatbox.scrollHeight);
  
        // Show "thinking..." then call generateResponse
        setTimeout(() => {
          const incomingChatLi = createChatLi('A Pensar...', 'incoming');
          chatbox.appendChild(incomingChatLi);
          chatbox.scrollTo(0, chatbox.scrollHeight);
          generateResponse(incomingChatLi, userMessage);
        }, 600);
      };
  
      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = `${inputInitHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
      });
  
      // Send on Enter (desktop only)
      chatInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) {
          e.preventDefault();
          handleChat();
        }
      });
      // Send on click
      sendChatBtn.addEventListener('click', handleChat);
  
      // Start conversation automatically
      const startConversation = () => {
        fetch('https://server-l6cq.onrender.com/start')
          .then(response => response.json())
          .then(data => {
            const threadId = data.thread_id;
            sessionStorage.setItem('threadId', threadId);
          })
          .catch(error => console.error('Error starting conversation:', error));
      };
  
      // On page load, start conversation (once) and open
      window.addEventListener('load', () => {
        if (!sessionStorage.getItem('chatStarted')) {
          startConversation();
          sessionStorage.setItem('chatStarted', 'true');
        }
        document.body.classList.add('show-chatbot'); // ensures toggler is "open"
      });
  
      // Close button
      closeBtn?.addEventListener('click', () => {
        document.body.classList.remove('show-chatbot');
        sessionStorage.removeItem('chatStarted'); 
      });
  
      // Toggler if you want it
      chatbotToggler?.addEventListener('click', () => {
        document.body.classList.toggle('show-chatbot');
      });
    }
  })();
  