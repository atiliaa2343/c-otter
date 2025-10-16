import sqlalchemy as db
from openai import OpenAI
import pandas as pd
from dotenv import load_dotenv
import os

# Will generate random numbers to test vector embedding capabilities
# import numpy as np
# def embedding_tester(content):
#     embedding = np.random.rand(1536)
#     print(embedding.shape)
#     print(content)
#     return embedding

# Load environment variables from the .env file
load_dotenv()


# Access environment variables
database_url = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# def embedding_tester(content):
#     embedding = np.random.rand(1536)
#     print(embedding.shape)
#     print(content)
#     return embedding


def embed(content):
    response = client.embeddings.create(
        input=content,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

organizations_df = pd.read_excel("data/Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx", sheet_name="Petersburg Facilities")
organizations_df.columns = organizations_df.columns.str.strip()

# vector embeddings
organizations_df['embedding'] = organizations_df.apply(lambda row: embed("{} specializes in {} with an address {} opened during {}"
                                                                        .format(
                                                                            row['Name of Organization'], 
                                                                            row['Theme (Type)'], 
                                                                            row['Address'], 
                                                                            row['Hours'] )
                                                                        ), 
                                                                    axis=1)


# Ensures data integrity with id, updated_at, name, address, phone_number, theme, embedding 
organizations_df.rename(columns={
    "Name of Organization" : "name",
    "Address" : "address",
    "Phone number": "phone_number",
    "Theme (Type)" : "theme",
    "location_id" : "id"
    }, inplace=True)

# Drop the column Hours since it is contained inside of hours_of_operation as a dimension table
organizations_df.drop(columns=["Hours"], inplace=True)

# In case database transfer fails, jsonify
organizations_df.to_json("test.json" ,orient='index', indent=2)


# print("Inserting into the database!")
# engine = db.create_engine(database_url) # create a db engine to make a connection
# organizations_df.to_sql("locations", engine, if_exists='replace', index=False) # replace the data if it already exist
# print("Database inserts complete!")