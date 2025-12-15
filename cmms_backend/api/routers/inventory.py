"""
Inventory management routes (using parts table)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from database.connection import get_db
from database.models_cmms import Part, InventoryLevel
from api.auth import get_current_active_user
from api.schemas import InventoryDto, CreateInventoryDto, UpdateInventoryDto

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


@router.get("", response_model=List[InventoryDto])
async def get_inventory(
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_stock_level: Optional[int] = None,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all inventory items with optional filters"""
    query = db.query(Part)
    
    if search:
        query = query.filter(
            or_(
                Part.name.like(f"%{search}%"),
                Part.sku.like(f"%{search}%")
            )
        )
    
    if category:
        query = query.filter(Part.category == category)
    
    parts = query.all()
    result = []
    
    for part in parts:
        # Get inventory level
        inv_level = db.query(InventoryLevel).filter(InventoryLevel.part_id == part.id).first()
        quantity = inv_level.quantity_on_hand if inv_level else 0
        min_stock = part.safety_stock or 0
        
        # Filter by min_stock_level if provided
        if min_stock_level is not None and quantity >= min_stock_level:
            continue
        
        result.append(InventoryDto(
            id=part.id,
            name=part.name,
            sku=part.sku,
            quantity=quantity,
            min_stock_level=min_stock,
            location=inv_level.bin_location if inv_level else None,
            unit_price=part.buy_price,
            created_at=part.created_at
        ))
    
    return result


@router.get("/{inventory_id}", response_model=InventoryDto)
async def get_inventory_item(
    inventory_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get inventory item by ID"""
    part = db.query(Part).filter(Part.id == inventory_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    inv_level = db.query(InventoryLevel).filter(InventoryLevel.part_id == part.id).first()
    
    return InventoryDto(
        id=part.id,
        name=part.name,
        sku=part.sku,
        quantity=inv_level.quantity_on_hand if inv_level else 0,
        min_stock_level=part.safety_stock or 0,
        location=inv_level.bin_location if inv_level else None,
        unit_price=part.buy_price,
        created_at=part.created_at
    )


@router.post("", response_model=InventoryDto, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    inventory_data: CreateInventoryDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new inventory item"""
    # Check if SKU already exists
    if inventory_data.sku:
        existing = db.query(Part).filter(Part.sku == inventory_data.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="SKU already exists"
            )
    
    part = Part(
        name=inventory_data.name,
        sku=inventory_data.sku or f"SKU-{inventory_data.name[:10].upper()}",
        description=None,
        category=None,
        buy_price=inventory_data.unit_price,
        safety_stock=inventory_data.min_stock_level
    )
    
    db.add(part)
    db.commit()
    db.refresh(part)
    
    # Create inventory level
    inv_level = InventoryLevel(
        part_id=part.id,
        quantity_on_hand=inventory_data.quantity or 0,
        bin_location=inventory_data.location
    )
    db.add(inv_level)
    db.commit()
    
    return InventoryDto(
        id=part.id,
        name=part.name,
        sku=part.sku,
        quantity=inv_level.quantity_on_hand,
        min_stock_level=part.safety_stock or 0,
        location=inv_level.bin_location,
        unit_price=part.buy_price,
        created_at=part.created_at
    )


@router.put("/{inventory_id}", response_model=InventoryDto)
async def update_inventory_item(
    inventory_id: int,
    inventory_data: UpdateInventoryDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update inventory item"""
    part = db.query(Part).filter(Part.id == inventory_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    update_data = inventory_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "quantity":
            # Update inventory level
            inv_level = db.query(InventoryLevel).filter(InventoryLevel.part_id == part.id).first()
            if inv_level:
                inv_level.quantity_on_hand = value
            else:
                inv_level = InventoryLevel(part_id=part.id, quantity_on_hand=value)
                db.add(inv_level)
        elif key == "location":
            inv_level = db.query(InventoryLevel).filter(InventoryLevel.part_id == part.id).first()
            if inv_level:
                inv_level.bin_location = value
            else:
                inv_level = InventoryLevel(part_id=part.id, bin_location=value)
                db.add(inv_level)
        elif key == "unit_price":
            part.buy_price = value
        elif key == "min_stock_level":
            part.safety_stock = value
        elif hasattr(part, key):
            setattr(part, key, value)
    
    db.commit()
    db.refresh(part)
    
    inv_level = db.query(InventoryLevel).filter(InventoryLevel.part_id == part.id).first()
    return InventoryDto(
        id=part.id,
        name=part.name,
        sku=part.sku,
        quantity=inv_level.quantity_on_hand if inv_level else 0,
        min_stock_level=part.safety_stock or 0,
        location=inv_level.bin_location if inv_level else None,
        unit_price=part.buy_price,
        created_at=part.created_at
    )


@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(
    inventory_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete inventory item"""
    part = db.query(Part).filter(Part.id == inventory_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    # Delete inventory level first
    inv_level = db.query(InventoryLevel).filter(InventoryLevel.part_id == part.id).first()
    if inv_level:
        db.delete(inv_level)
    
    db.delete(part)
    db.commit()
    return None

