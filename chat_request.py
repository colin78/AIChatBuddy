import os
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)
from models import Message
import redis

redis_host = os.environ.get('REDIS_HOST', 'localhost')
redis_port = int(os.environ.get('REDIS_PORT', 6379))
redis_db = int(os.environ.get('REDIS_DB', 0))
redis_username = os.environ.get('REDIS_USERNAME', None)
redis_password = os.environ.get('REDIS_PASSWORD', None)

# Set up Redis client
r = redis.Redis(host=redis_host, port=redis_port, db=redis_db,
                username=redis_username, password=redis_password)

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
            f"{'CustomGPT' if msg.is_ai else 'User'}: {msg.content}"
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

    full_prompt = f"{context}\n\n{conversation_history}\nCustomGPT:"
    print(f"Full Prompt: {full_prompt}")  # Log the full prompt

    # Generate cache key
    cache_key = f"{context}-{full_prompt}"
    # Check if response is in cache
    cached_response = r.get(cache_key)
    if cached_response:
        print(f"Serving from cache: {cache_key}")
        return cached_response.decode('utf-8')

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

        # Store response in cache with an expiration time of 1 hour
        # r.setex(cache_key, 3600, content)
        # Store response in cache without an expiration time
        r.set(cache_key, content)

        return content
    except Exception as e:
        error_message = f"Error in send_openai_request: {str(e)}"
        print(error_message)
        return f"I apologize, but I encountered an error while processing your request. {error_message}"
