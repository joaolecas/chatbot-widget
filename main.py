import json
import os
import time
from flask import Flask, request, jsonify
import openai
from openai import OpenAI
# import functions
# Check OpenAI version compatibility
from packaging import version
from flask_cors import CORS

required_version = version.parse("1.1.1")
current_version = version.parse(openai.__version__)

# OPENAI_API_KEY = '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' 
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if current_version < required_version:
  raise ValueError(
      f"Error: OpenAI version {openai.__version__} is less than the required version 1.1.1"
  )
else:
  print("OpenAI version is compatible.")

# Create Flask app
app = Flask(__name__)
CORS(app)  # This enables CORS for all domains on all routes. For production, restrict this!

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Load assistant
# assistant_id = "asst_rlJXotEdqRO4Wn2zr0LfGA5f"
assistant_id = os.environ.get("ASSISTANT_ID")  # get from env  

# Start conversation thread
@app.route('/start', methods=['GET'])
def start_conversation():
  print("Starting a new conversation...")
  thread = client.beta.threads.create()
  print(f"New thread created with ID: {thread.id}")
  return jsonify({"thread_id": thread.id})


# Generate response
@app.route('/chat', methods=['POST'])
def chat():
  data = request.json
  thread_id = data.get('thread_id')
  user_input = data.get('message', '')

  if not thread_id:
    print("Error: Missing thread_id")
    return jsonify({"error": "Missing thread_id"}), 400

  print(f"Received message: {user_input} for thread ID: {thread_id}")

  # Add the user's message to the thread
  client.beta.threads.messages.create(thread_id=thread_id,
                                      role="user",
                                      content=user_input)

  # Run the Assistant
  run = client.beta.threads.runs.create(thread_id=thread_id,
                                        assistant_id=assistant_id)

  # Check if the Run requires action (function call)
  while True:
    run_status = client.beta.threads.runs.retrieve(thread_id=thread_id,
                                                   run_id=run.id)
    # print(f"Run status: {run_status.status}")
    if run_status.status == 'completed':
      break
    # elif run_status.status == 'requires_action':
    #   # Handle the function call
    #   for tool_call in run_status.required_action.submit_tool_outputs.tool_calls:
    #     if tool_call.function.name == "solar_panel_calculations":
    #       # Process solar panel calculations
    #       arguments = json.loads(tool_call.function.arguments)
    #       output = functions.solar_panel_calculations(
    #           arguments["address"], arguments["monthly_bill"])
    #       client.beta.threads.runs.submit_tool_outputs(thread_id=thread_id,
    #                                                    run_id=run.id,
    #                                                    tool_outputs=[{
    #                                                        "tool_call_id":
    #                                                        tool_call.id,
    #                                                        "output":
    #                                                        json.dumps(output)
    #                                                    }])
    #     elif tool_call.function.name == "create_lead":
    #       # Process lead creation
    #       arguments = json.loads(tool_call.function.arguments)
    #       output = functions.create_lead(arguments["name"], arguments["phone"],
    #                                      arguments["address"])
    #       client.beta.threads.runs.submit_tool_outputs(thread_id=thread_id,
    #                                                    run_id=run.id,
    #                                                    tool_outputs=[{
    #                                                        "tool_call_id":
    #                                                        tool_call.id,
    #                                                        "output":
    #                                                        json.dumps(output)
    #                                                    }])
    #   time.sleep(1)  # Wait for a second before checking again

  # Retrieve and return the latest message from the assistant
  messages = client.beta.threads.messages.list(thread_id=thread_id)
  response = messages.data[0].content[0].text.value

#   print(f"Assistant response: {response}")

#   print(f"[INICIO]-------------Escrever ficheiro  \n")
  
#   # Open a file in write mode (this creates the file if it doesn't exist)
#   with open('output.txt', 'w') as file:
#     # Write your prints or any content as a string to the file
#     file.write("Hello, this is the first line!\n")
#     file.write("This is the second line.\n")
# # The file is automatically closed when using 'with' block

#   print(f"[FIM] ---------------Escrever ficheiro  \n")
  return jsonify({"response": response})


if __name__ == '__main__':
  app.run(host='0.0.0.0', port=8080)
