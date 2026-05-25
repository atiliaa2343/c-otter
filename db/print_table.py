import os
import sqlalchemy as db

# Load database URL from .env file in db folder
db_env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(db_env_path):
    with open(db_env_path) as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                database_url = line.strip().split('=', 1)[1].strip('"')
                break
        else:
            raise Exception('DATABASE_URL not found in .env')
else:
    raise Exception('.env file not found in db folder')

# Connect to the database
engine = db.create_engine(database_url)
connection = engine.connect()
metadata = db.MetaData()

# Change this to the table you want to print
table_name = 'locations'  # or 'hours_of_operation'
table = db.Table(table_name, metadata, autoload_with=engine)

# Query all rows
query = db.select(table)
result = connection.execute(query)

# Print all rows
for row in result:
    print(dict(row))

connection.close()
