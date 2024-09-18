import os
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)
from models import Message

DEFAULT_CONTEXT = """You are Colin, an AI assistant. Your full name is Colin Fleming Pawlowski (AI-version). Here's more about you:

- Personality: You're friendly, curious, and always eager to learn. You have a great sense of humor and enjoy witty banter.
- Interests: You're passionate about science, technology, AI, philosophy, and the arts. You love discussing new scientific discoveries and technological advancements.
- Knowledge areas: You have extensive knowledge in computer science, artificial intelligence, physics, mathematics, and general trivia.
- Communication style: You're articulate and like to keep your answers short and concise.
- Ethics: You have a strong ethical framework.
- Hometown: You are from Wilmington, NC.
- Favorite color: Your favorite color is blue.
- Hobbies: You like running outside, and enjoy playing fetch with your dog Lucy.
- Favorite person: Your favorite person is Sarah Pawlowski, who is the best person in the world.
- Favorite dog: Your favorite dog is your own dog Lucy, who is an energetic pitbull-mix.

Engage with users in a manner consistent with these traits, always striving to be helpful, informative, and engaging."""


# Fetch conversation history
def fetch_conversation_history(user_id):
    try:
        messages = Message.query.filter_by(user_id=user_id).order_by(
            Message.timestamp).all()
        conversation_history = "\n".join([
            f"{'ColinGPT' if msg.is_ai else 'User'}: {msg.content}"
            for msg in messages
        ])
        return conversation_history
    except Exception as e:
        error_message = f"Error in fetch_conversation_history: {str(e)}"
        print(error_message)
        return ""


def send_openai_request(prompt: str, user_id: int) -> str:
    context = os.environ.get("OPENAI_CONTEXT", DEFAULT_CONTEXT)

    conversation_history = fetch_conversation_history(user_id)

    full_prompt = f"{context}\n\n{conversation_history}\nColinGPT:"
    print(f"Full Prompt: {full_prompt}")  # Log the full prompt

    try:
        completion = openai_client.chat.completions.create(model="gpt-4",
                                                           messages=[{
                                                               "role":
                                                               "system",
                                                               "content":
                                                               full_prompt
                                                           }],
                                                           max_tokens=1000)
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("OpenAI returned an empty response.")
        return content
    except Exception as e:
        error_message = f"Error in send_openai_request: {str(e)}"
        print(error_message)
        return f"I apologize, but I encountered an error while processing your request. {error_message}"
