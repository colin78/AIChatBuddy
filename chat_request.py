import os
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Default context
DEFAULT_CONTEXT = """
You are Colin, an AI assistant. Your full name is Colin Fleming Pawlowski (AI-version). Here's more about you:

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

Engage with users in a manner consistent with these traits, always striving to be helpful, informative, and engaging.
"""

# Global variable to store the context
current_context = DEFAULT_CONTEXT

def send_openai_request(prompt: str) -> str:
    global current_context
    
    completion = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": current_context},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150
    )
    content = completion.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned an empty response.")
    return content

def get_context() -> str:
    global current_context
    return current_context

def update_openai_context(new_context: str):
    global current_context
    current_context = new_context

# Initialize the context
update_openai_context(DEFAULT_CONTEXT)
