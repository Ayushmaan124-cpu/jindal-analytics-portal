import os
import pyodbc
from dotenv import load_dotenv
load_dotenv()

conn= pyodbc.connect(
    f"DRIVER={{{os.getenv('DB_DRIVER')}}};"
    f"SERVER={os.getenv('DB_SERVER')};"
    f"DATABASE={os.getenv('DB_NAME')};"
    f"UID={os.getenv('DB_USER')};"
    f"PWD={os.getenv('DB_PASSWORD')};"
)
print("Connected Successfully!")
cursor= conn.cursor()
cursor.execute(""" SELECT TOP  1 *
               FROM dbo.r_ClassifyResult_1d
               """)
row= cursor.fetchone()
for i, column in enumerate(cursor.description):
    print(column[0], "=", row[i])