import sqlalchemy as db
from openai import OpenAI
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()


# Access environment variables
database_url = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

def embed(content):
    response = client.embeddings.create(
        input=content,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding





organizations_df = pd.read_excel("Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx", sheet_name="Petersburg Facilities")
organizations_df.columns = organizations_df.columns.str.strip()

organizations_df['embedding'] = organizations_df.apply(lambda row: embed("{} specializes in {} with an address {} opened during {}"
                                                                        .format(
                                                                            row['Name of Organization'], 
                                                                            row['Theme (Type)'], 
                                                                            row['Address'], 
                                                                            row['Hours'] )
                                                                        ), 
                                                                    axis=1)

organizations_df.to_json("test.json" ,orient='index', indent=2)