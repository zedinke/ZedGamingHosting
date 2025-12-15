"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Authentication schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_id: int
    username: str
    role_name: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "USER"


class RegisterResponse(BaseModel):
    user_id: int


# User schemas
class UserDto(BaseModel):
    id: int
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: str = "USER"


class CreateUserResponse(BaseModel):
    id: int


# Machine schemas
class MachineDto(BaseModel):
    id: int
    production_line_id: Optional[int] = None
    name: str
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = None
    asset_tag: Optional[str] = None
    description: Optional[str] = None
    install_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CreateMachineDto(BaseModel):
    production_line_id: Optional[int] = None
    name: str
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = None
    asset_tag: Optional[str] = None
    description: Optional[str] = None
    install_date: Optional[datetime] = None


class UpdateMachineDto(BaseModel):
    production_line_id: Optional[int] = None
    name: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = None
    asset_tag: Optional[str] = None
    description: Optional[str] = None
    install_date: Optional[datetime] = None


# Asset schemas
class AssetDto(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    asset_tag: Optional[str] = None
    location: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class CreateAssetDto(BaseModel):
    name: str
    category: Optional[str] = None
    asset_tag: Optional[str] = None
    location: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None


class UpdateAssetDto(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    asset_tag: Optional[str] = None
    location: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None


# Inventory schemas
class InventoryDto(BaseModel):
    id: int
    name: str
    sku: Optional[str] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    location: Optional[str] = None
    unit_price: Optional[float] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CreateInventoryDto(BaseModel):
    name: str
    sku: Optional[str] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    location: Optional[str] = None
    unit_price: Optional[float] = None


class UpdateInventoryDto(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    location: Optional[str] = None
    unit_price: Optional[float] = None


# Worksheet schemas
class WorksheetPartDto(BaseModel):
    inventory_id: int
    qty: int


class WorksheetDto(BaseModel):
    id: int
    worksheet_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    scheduled_start_date: Optional[datetime] = None
    scheduled_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    completion_notes: Optional[str] = None
    parts_used: Optional[List[WorksheetPartDto]] = None
    
    class Config:
        from_attributes = True


class CreateWorksheetDto(BaseModel):
    worksheet_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    scheduled_start_date: Optional[datetime] = None
    scheduled_end_date: Optional[datetime] = None


class UpdateWorksheetDto(BaseModel):
    worksheet_number: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    scheduled_start_date: Optional[datetime] = None
    scheduled_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    completion_notes: Optional[str] = None


# PM Task schemas
class PMTaskDto(BaseModel):
    id: int
    machine_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    frequency: Optional[str] = None
    next_due_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CreatePMTaskDto(BaseModel):
    machine_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    frequency: Optional[str] = None
    next_due_date: Optional[datetime] = None


class UpdatePMTaskDto(BaseModel):
    machine_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    next_due_date: Optional[datetime] = None


# Reports schemas
class ReportsSummaryDto(BaseModel):
    machines_total: int
    worksheets_open: int
    inventory_low_stock: int
    pm_due_this_week: int

