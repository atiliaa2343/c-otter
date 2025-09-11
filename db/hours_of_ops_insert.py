import sqlalchemy as db
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Access environment variables
database_url = os.getenv("DATABASE_URL")

hours_of_ops_df = pd.read_excel("data/hours_of_operation.xlsx")
print(hours_of_ops_df)

engine = db.create_engine(database_url) # create a db engine to make a connection
hours_of_ops_df.to_sql("hours_of_operation", engine, if_exists='replace', index=False) # replace the data if it already exist
print("Database inserts complete!")