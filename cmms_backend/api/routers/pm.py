"""
Preventive Maintenance routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from database.models_cmms import PMTask
from api.auth import get_current_active_user
from api.schemas import PMTaskDto, CreatePMTaskDto, UpdatePMTaskDto

router = APIRouter(prefix="/api/v1/pm", tags=["pm"])


@router.get("/tasks", response_model=List[PMTaskDto])
async def get_pm_tasks(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all PM tasks"""
    tasks = db.query(PMTask).all()
    result = []
    for task in tasks:
        result.append(PMTaskDto(
            id=task.id,
            machine_id=task.machine_id,
            title=task.task_name,
            description=task.task_description,
            frequency=f"{task.frequency_days} days" if task.frequency_days else None,
            next_due_date=task.next_due_date
        ))
    return result


@router.get("/tasks/{task_id}", response_model=PMTaskDto)
async def get_pm_task(
    task_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get PM task by ID"""
    task = db.query(PMTask).filter(PMTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PM task not found"
        )
    
    return PMTaskDto(
        id=task.id,
        machine_id=task.machine_id,
        title=task.task_name,
        description=task.task_description,
        frequency=f"{task.frequency_days} days" if task.frequency_days else None,
        next_due_date=task.next_due_date
    )


@router.post("/tasks", response_model=PMTaskDto, status_code=status.HTTP_201_CREATED)
async def create_pm_task(
    task_data: CreatePMTaskDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new PM task"""
    # Parse frequency if provided as string
    frequency_days = None
    if task_data.frequency:
        if "day" in task_data.frequency.lower():
            try:
                frequency_days = int(task_data.frequency.split()[0])
            except:
                pass
    
    task = PMTask(
        machine_id=task_data.machine_id,
        task_name=task_data.title,
        task_description=task_data.description,
        frequency_days=frequency_days,
        next_due_date=task_data.next_due_date,
        is_active=True
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return PMTaskDto(
        id=task.id,
        machine_id=task.machine_id,
        title=task.task_name,
        description=task.task_description,
        frequency=f"{task.frequency_days} days" if task.frequency_days else None,
        next_due_date=task.next_due_date
    )


@router.put("/tasks/{task_id}", response_model=PMTaskDto)
async def update_pm_task(
    task_id: int,
    task_data: UpdatePMTaskDto,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update PM task"""
    task = db.query(PMTask).filter(PMTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PM task not found"
        )
    
    if task_data.title:
        task.task_name = task_data.title
    if task_data.description is not None:
        task.task_description = task_data.description
    if task_data.machine_id is not None:
        task.machine_id = task_data.machine_id
    if task_data.next_due_date:
        task.next_due_date = task_data.next_due_date
    if task_data.frequency:
        try:
            task.frequency_days = int(task_data.frequency.split()[0])
        except:
            pass
    
    db.commit()
    db.refresh(task)
    
    return PMTaskDto(
        id=task.id,
        machine_id=task.machine_id,
        title=task.task_name,
        description=task.task_description,
        frequency=f"{task.frequency_days} days" if task.frequency_days else None,
        next_due_date=task.next_due_date
    )


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pm_task(
    task_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete PM task"""
    task = db.query(PMTask).filter(PMTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PM task not found"
        )
    
    db.delete(task)
    db.commit()
    return None

