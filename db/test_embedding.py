from openai import OpenAI
from dotenv import load_dotenv
import os
# NOTE: File for testing embeddings using OpenAI

# load env variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

response = client.embeddings.create(
    input="Your text string goes here",
    model="text-embedding-3-small"
)

print(response.data[0].embedding)