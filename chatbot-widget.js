
(function () {
    const container = document.getElementById("chatbot-container");

    // Dynamically load chatbot CSS
    const chatbotStyles = document.createElement("link");
    chatbotStyles.rel = "stylesheet";
    chatbotStyles.href = "https://chatbot-widget-six.vercel.app/chatbot-widget.css";  //"chatbot-widget.css"; // Chatbot's CSS file
    document.head.appendChild(chatbotStyles);

    // Load the chatbot HTML
    fetch("https://chatbot-widget-six.vercel.app/chatbot-widget.html")
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;

            // // Load the chatbot script after the widget is added
            const chatbotToggler = document.querySelector(".chatbot-toggler");
            const closeBtn = document.querySelector(".close-btn");
            const chatbox = document.querySelector(".chatbox");
            const chatInput = document.querySelector(".chat-input textarea");
            const sendChatBtn = document.querySelector(".chat-input span");

            let userMessage = null; // Variable to store user's message
            const API_KEY = "PASTE-YOUR-API-KEY"; // Paste your API key here
            const inputInitHeight = chatInput.scrollHeight;


            const createChatLi = (message, className) => {
                const chatLi = document.createElement("li");
                chatLi.classList.add("chat", `${className}`);

                // If the message is incoming (from the chatbot), add an avatar image
                let chatContent = className === "outgoing" 
                    ? `<p></p>` 
                    : `<img src="avatar.png" alt="Avatar" class="chat-avatar"><p></p>`;

                chatLi.innerHTML = chatContent;
                chatLi.querySelector("p").textContent = message;
                return chatLi;
            };


            const generateResponse = (chatElement, userMessage) => {
                // const API_URL = "http://127.0.0.1:8080/chat"; // Flask route
                const API_URL = "https://server-l6cq.onrender.com/chat"; // Flask route
                const messageElement = chatElement.querySelector("p");
                const threadId = sessionStorage.getItem('threadId'); // Retrieve the thread ID

                if (!threadId) {
                    console.error('Thread ID is missing. Cannot send message.');
                    return;
                }

                const requestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        thread_id: threadId, // Use the retrieved thread ID
                        message: userMessage,
                    })
                };

                fetch(API_URL, requestOptions)
                    .then(res => res.json())
                    .then(data => {
                        messageElement.textContent = data.response; // Update with the response
                    })
                    .catch(() => {
                        messageElement.classList.add("error");
                        messageElement.textContent = "Oops! Something went wrong. Please try again.";
                    })
                    .finally(() => chatElement.scrollTo(0, chatElement.scrollHeight));
            };

            const handleChat = () => {
                userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
                if(!userMessage) return;

                // Clear the input textarea and set its height to default
                chatInput.value = "";
                chatInput.style.height = `${inputInitHeight}px`;

                // Append the user's message to the chatbox
                chatbox.appendChild(createChatLi(userMessage, "outgoing"));
                chatbox.scrollTo(0, chatbox.scrollHeight);
                
                setTimeout(() => {
                    // Display "Thinking..." message while waiting for the response
                    const incomingChatLi = createChatLi("A Pensar...", "incoming");
                    chatbox.appendChild(incomingChatLi);
                    chatbox.scrollTo(0, chatbox.scrollHeight);
                    generateResponse(incomingChatLi, userMessage);
                }, 600);
            }

            chatInput.addEventListener("input", () => {
                // Adjust the height of the input textarea based on its content
                chatInput.style.height = `${inputInitHeight}px`;
                chatInput.style.height = `${chatInput.scrollHeight}px`;
            });

            chatInput.addEventListener("keydown", (e) => {
                // If Enter key is pressed without Shift key and the window width is greater than 800px, handle the chat
                if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
                    e.preventDefault();
                    handleChat();
                }
            });

            sendChatBtn.addEventListener("click", handleChat);


            const startConversation = () => {
                // fetch('http://127.0.0.1:8080/start')
                fetch('https://server-l6cq.onrender.com/start')
                    .then(response => response.json())
                    .then(data => {
                        const threadId = data.thread_id; // The thread ID from the backend
                        sessionStorage.setItem('threadId', threadId); // Store thread ID for later use
                    })
                    .catch(error => console.error('Error starting conversation:', error));
            };

            // Automatically open the chatbot when the page loads
            window.addEventListener('load', () => {
                if (!sessionStorage.getItem('chatStarted')) {
                    startConversation(); // Start the conversation automatically
                    sessionStorage.setItem('chatStarted', 'true'); // Mark the chat as started
                }
                document.body.classList.add("show-chatbot"); // Automatically show the chatbot
            });

            // Event listener for closing the chatbot
            closeBtn.addEventListener("click", () => {
                document.body.classList.remove("show-chatbot"); // Close the chatbot
                sessionStorage.removeItem('chatStarted'); // Optionally reset chat status on close
            });

            // Optional: re-enable manual toggling of the chatbot (if you still want a toggle button)
            chatbotToggler.addEventListener("click", () => {
                document.body.classList.toggle("show-chatbot");
            });

            // const script = document.createElement("script");
            // script.src = "script.js";
            // document.body.appendChild(script);
        })
        .catch(error => console.error("Error loading chatbot widget:", error));
})();