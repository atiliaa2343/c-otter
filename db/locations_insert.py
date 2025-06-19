import sqlalchemy as db
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Access environment variables
database_url = os.getenv("DATABASE_URL")

organizations_df = pd.read_excel("Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx", sheet_name="Petersburg Facilities")
phrases_df = pd.read_excel("Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx", sheet_name="Healthcare Phrases")

phrases_df = phrases_df[phrases_df["Long term Care"] != 0].dropna() # data cleaning for removing missing values
phrases_df.to_csv("healthcare_phrases.csv", index=False)