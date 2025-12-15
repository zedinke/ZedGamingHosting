"""
Machine management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_db
from database.models_cmms import Machine
from api.auth import get_current_active_user
from api.schemas import MachineDto, CreateMachineDto, UpdateMachineDto

router = APIRouter(prefix="/api/v1/machines", tags=["machines"])


@router.get("", response_model=List[MachineDto])
async def get_machines(
    status_filter: Optional[str] = None,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all machines with optional status filter"""
    query = db.query(Machine)
    if status_filter:
        query = query.filter(Machine.status == status_filter)
    machines = query.all()
    return machines


@router.get("/{machine_id}", response_model=MachineDto)
async def get_machine(
    machine_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get machine by ID"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )
    return machine


@router.post("", response_model=MachineDto, status_code=status.HTTP_201_CREATED)
async def create_machine(
    machine_data: CreateMachineDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new machine"""
    machine = Machine(**machine_data.dict(exclude_unset=True))
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


@router.put("/{machine_id}", response_model=MachineDto)
async def update_machine(
    machine_id: int,
    machine_data: UpdateMachineDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update machine"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )
    
    update_data = machine_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(machine, key, value)
    
    db.commit()
    db.refresh(machine)
    return machine


@router.delete("/{machine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_machine(
    machine_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete machine"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )
    
    db.delete(machine)
    db.commit()
    return None

