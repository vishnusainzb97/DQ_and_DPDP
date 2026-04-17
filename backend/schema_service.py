from sqlalchemy import inspect
from setup_db import engine

def get_schema():
    inspector = inspect(engine)
    schema_info = []
    for table_name in inspector.get_table_names():
        columns = []
        for column in inspector.get_columns(table_name):
            columns.append({
                "name": column['name'],
                "type": str(column['type'])
            })
        schema_info.append({
            "table_name": table_name,
            "columns": columns
        })
    return schema_info
