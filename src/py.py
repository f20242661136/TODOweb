from IPython.display import display, HTML

# Mock chat history for demonstration
class ChatHistory:
    def __init__(self):
        self.messages = []
    def add_user_message(self, message):
        self.messages.append({"role": "user", "content": message})

async def main():
    # Define the chat history
    chat_history = ChatHistory()

    # Respond to user input
    user_inputs = [
        "Plan me a day trip.",
        "I don't like that destination. Plan another vacation."
    ]

    html_output = ""

    for user_input in user_inputs:
        # Add the user input to the chat history
        chat_history.add_user_message(user_input)

        # Build HTML for display
        html_output += f"""
        <div style='margin-bottom:10px'>
            <div style='font-weight:bold'>User:</div>
            <div style='margin-left:28px'>{user_input}</div>
        </div>
        """

    # Display the chat in the notebook
    display(HTML(html_output))

# Run the async function
import asyncio

