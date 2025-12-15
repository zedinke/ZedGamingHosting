"""
Worksheet management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_db
from database.models_cmms import Worksheet, WorksheetPart
from api.auth import get_current_active_user
from api.schemas import WorksheetDto, CreateWorksheetDto, UpdateWorksheetDto, WorksheetPartDto

router = APIRouter(prefix="/api/v1/worksheets", tags=["worksheets"])


@router.get("", response_model=List[WorksheetDto])
async def get_worksheets(
    status_filter: Optional[str] = None,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all worksheets with optional status filter"""
    query = db.query(Worksheet)
    if status_filter:
        query = query.filter(Worksheet.status == status_filter)
    worksheets = query.all()
    
    result = []
    for ws in worksheets:
        # Get parts used
        parts = db.query(WorksheetPart).filter(WorksheetPart.worksheet_id == ws.id).all()
        parts_used = [WorksheetPartDto(inventory_id=p.part_id, qty=p.quantity_used) for p in parts]
        
        result.append(WorksheetDto(
            id=ws.id,
            worksheet_number=None,  # Not in schema
            title=ws.title,
            description=ws.description,
            type=None,  # Not in schema
            priority=None,  # Not in schema
            status=ws.status,
            assigned_to_user_id=ws.assigned_to_user_id,
            scheduled_start_date=None,  # Not in schema
            scheduled_end_date=None,  # Not in schema
            actual_start_date=ws.breakdown_time,
            actual_end_date=ws.repair_finished_time,
            completion_notes=ws.notes,
            parts_used=parts_used
        ))
    
    return result


@router.get("/{worksheet_id}", response_model=WorksheetDto)
async def get_worksheet(
    worksheet_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get worksheet by ID"""
    worksheet = db.query(Worksheet).filter(Worksheet.id == worksheet_id).first()
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worksheet not found"
        )
    
    parts = db.query(WorksheetPart).filter(WorksheetPart.worksheet_id == worksheet.id).all()
    parts_used = [WorksheetPartDto(inventory_id=p.part_id, qty=p.quantity_used) for p in parts]
    
    return WorksheetDto(
        id=worksheet.id,
        worksheet_number=None,
        title=worksheet.title,
        description=worksheet.description,
        type=None,
        priority=None,
        status=worksheet.status,
        assigned_to_user_id=worksheet.assigned_to_user_id,
        scheduled_start_date=None,
        scheduled_end_date=None,
        actual_start_date=worksheet.breakdown_time,
        actual_end_date=worksheet.repair_finished_time,
        completion_notes=worksheet.notes,
        parts_used=parts_used
    )


@router.post("", response_model=WorksheetDto, status_code=status.HTTP_201_CREATED)
async def create_worksheet(
    worksheet_data: CreateWorksheetDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new worksheet"""
    worksheet = Worksheet(
        machine_id=1,  # Default, should be in DTO
        assigned_to_user_id=worksheet_data.assigned_to_user_id or current_user.id,
        title=worksheet_data.title,
        description=worksheet_data.description,
        status="PENDING"
    )
    
    db.add(worksheet)
    db.commit()
    db.refresh(worksheet)
    
    return WorksheetDto(
        id=worksheet.id,
        worksheet_number=None,
        title=worksheet.title,
        description=worksheet.description,
        type=worksheet_data.type,
        priority=worksheet_data.priority,
        status=worksheet.status,
        assigned_to_user_id=worksheet.assigned_to_user_id,
        scheduled_start_date=worksheet_data.scheduled_start_date,
        scheduled_end_date=worksheet_data.scheduled_end_date,
        actual_start_date=None,
        actual_end_date=None,
        completion_notes=None,
        parts_used=[]
    )


@router.put("/{worksheet_id}", response_model=WorksheetDto)
async def update_worksheet(
    worksheet_id: int,
    worksheet_data: UpdateWorksheetDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update worksheet"""
    worksheet = db.query(Worksheet).filter(Worksheet.id == worksheet_id).first()
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worksheet not found"
        )
    
    update_data = worksheet_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            worksheet.status = value
        elif key == "title" and value:
            worksheet.title = value
        elif key == "description" and value is not None:
            worksheet.description = value
        elif key == "completion_notes" and value is not None:
            worksheet.notes = value
        elif key == "actual_start_date" and value:
            worksheet.breakdown_time = value
        elif key == "actual_end_date" and value:
            worksheet.repair_finished_time = value
    
    db.commit()
    db.refresh(worksheet)
    
    parts = db.query(WorksheetPart).filter(WorksheetPart.worksheet_id == worksheet.id).all()
    parts_used = [WorksheetPartDto(inventory_id=p.part_id, qty=p.quantity_used) for p in parts]
    
    return WorksheetDto(
        id=worksheet.id,
        worksheet_number=None,
        title=worksheet.title,
        description=worksheet.description,
        type=None,
        priority=None,
        status=worksheet.status,
        assigned_to_user_id=worksheet.assigned_to_user_id,
        scheduled_start_date=None,
        scheduled_end_date=None,
        actual_start_date=worksheet.breakdown_time,
        actual_end_date=worksheet.repair_finished_time,
        completion_notes=worksheet.notes,
        parts_used=parts_used
    )


@router.delete("/{worksheet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_worksheet(
    worksheet_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete worksheet"""
    worksheet = db.query(Worksheet).filter(Worksheet.id == worksheet_id).first()
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worksheet not found"
        )
    
    # Delete parts first
    parts = db.query(WorksheetPart).filter(WorksheetPart.worksheet_id == worksheet.id).all()
    for part in parts:
        db.delete(part)
    
    db.delete(worksheet)
    db.commit()
    return None

