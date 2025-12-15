"""
SQLAlchemy database models for CMMS - matching actual database schema
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


# User and Role models
class Role(Base):
    """Role model"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    permissions = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=True)
    
    users = relationship("User", back_populates="role_obj")


class User(Base):
    """User model matching database schema"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=True)
    email = Column(String(120), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    profile_picture = Column(Text, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=True)
    language_preference = Column(String(10), nullable=True)
    must_change_password = Column(Boolean, default=False, nullable=True)
    anonymized_at = Column(DateTime, nullable=True)
    anonymized_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vacation_days_per_year = Column(Integer, nullable=True)
    vacation_days_used = Column(Integer, nullable=True)
    shift_type = Column(String(50), nullable=True)
    shift_start_time = Column(String(10), nullable=True)
    shift_end_time = Column(String(10), nullable=True)
    work_days_per_week = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    role_obj = relationship("Role", back_populates="users")


# Machine models
class ProductionLine(Base):
    """Production line model"""
    __tablename__ = "production_lines"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    machines = relationship("Machine", back_populates="production_line")


class Machine(Base):
    """Machine model"""
    __tablename__ = "machines"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    production_line_id = Column(Integer, ForeignKey("production_lines.id"), nullable=False)
    name = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=True)
    model = Column(String(100), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    manual_pdf_path = Column(String(500), nullable=True)
    install_date = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=True)
    maintenance_interval = Column(String(100), nullable=True)
    asset_tag = Column(String(50), unique=True, nullable=True)
    purchase_date = Column(DateTime, nullable=True)
    purchase_price = Column(Float, nullable=True)
    warranty_expiry_date = Column(DateTime, nullable=True)
    supplier = Column(String(200), nullable=True)
    operating_hours = Column(Float, nullable=True)
    last_service_date = Column(DateTime, nullable=True)
    next_service_date = Column(DateTime, nullable=True)
    criticality_level = Column(String(50), nullable=True)
    energy_consumption = Column(String(100), nullable=True)
    power_requirements = Column(String(200), nullable=True)
    operating_temperature_range = Column(String(100), nullable=True)
    weight = Column(Float, nullable=True)
    dimensions = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    version = Column(Integer, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    production_line = relationship("ProductionLine", back_populates="machines")


# Inventory models (using parts table)
class Part(Base):
    """Part/Inventory model"""
    __tablename__ = "parts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    unit = Column(String(20), nullable=True)
    buy_price = Column(Float, nullable=True)
    sell_price = Column(Float, nullable=True)
    safety_stock = Column(Integer, nullable=True)
    reorder_quantity = Column(Integer, nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    last_count_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class InventoryLevel(Base):
    """Inventory level model"""
    __tablename__ = "inventory_levels"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    part_id = Column(Integer, ForeignKey("parts.id"), unique=True, nullable=False)
    quantity_on_hand = Column(Integer, nullable=True)
    quantity_reserved = Column(Integer, nullable=True)
    bin_location = Column(String(100), nullable=True)
    last_updated = Column(DateTime, nullable=True)


class Supplier(Base):
    """Supplier model"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False)
    contact_person = Column(String(100), nullable=True)
    email = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=True)


# Worksheet models
class Worksheet(Base):
    """Worksheet model"""
    __tablename__ = "worksheets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    breakdown_time = Column(DateTime, nullable=True)
    repair_finished_time = Column(DateTime, nullable=True)
    total_downtime_hours = Column(Float, nullable=True)
    fault_cause = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class WorksheetPart(Base):
    """Worksheet part model"""
    __tablename__ = "worksheet_parts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    worksheet_id = Column(Integer, ForeignKey("worksheets.id"), nullable=False)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False)
    quantity_used = Column(Integer, nullable=False)
    unit_cost_at_time = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, nullable=True)


# PM Task models
class PMTask(Base):
    """Preventive Maintenance Task model"""
    __tablename__ = "pm_tasks"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    task_name = Column(String(150), nullable=False)
    task_description = Column(Text, nullable=True)
    task_type = Column(String(20), nullable=True)
    frequency_days = Column(Integer, nullable=True)
    last_executed_date = Column(DateTime, nullable=True)
    next_due_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String(20), nullable=True)
    status = Column(String(50), nullable=True)
    due_date = Column(DateTime, nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    location = Column(String(200), nullable=True)

