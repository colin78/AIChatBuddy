import os
import glob

# Find all .db files in the current directory
db_files = glob.glob('*.db')

if db_files:
    for db_file in db_files:
        try:
            os.remove(db_file)
            print(f"Deleted database file: {db_file}")
        except Exception as e:
            print(f"Error deleting {db_file}: {str(e)}")
else:
    print("No database files found")

print("Database cache cleared.")
