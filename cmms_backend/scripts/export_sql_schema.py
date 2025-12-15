"""
SQL Schema Export Script
Exports SQLAlchemy models to MySQL CREATE TABLE SQL statements
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.schema import CreateTable, CreateIndex
from sqlalchemy.dialects import mysql
from database.connection import engine
from database.models import Base

def export_schema():
    """Export database schema to SQL file"""
    output_file = Path(__file__).parent.parent / "database" / "cmms_schema.sql"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Get all tables
    tables = Base.metadata.tables
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- CMMS Database Schema\n")
        f.write("-- Generated from SQLAlchemy models\n")
        f.write("-- Database: MySQL 8.0+\n\n")
        f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
        
        # Create tables
        for table_name, table in tables.items():
            # CREATE TABLE statement
            create_table = CreateTable(table).compile(dialect=mysql.dialect())
            f.write(f"-- Table: {table_name}\n")
            f.write(str(create_table))
            f.write(";\n\n")
            
            # CREATE INDEX statements
            for index in table.indexes:
                create_index = CreateIndex(index).compile(dialect=mysql.dialect())
                f.write(f"-- Index: {index.name}\n")
                f.write(str(create_index))
                f.write(";\n\n")
        
        f.write("SET FOREIGN_KEY_CHECKS=1;\n")
    
    print(f"Schema exported to: {output_file}")
    print(f"Total tables: {len(tables)}")


if __name__ == "__main__":
    try:
        export_schema()
    except Exception as e:
        print(f"Error exporting schema: {e}")
        sys.exit(1)

