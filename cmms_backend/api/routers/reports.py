"""
Reports and dashboard routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database.connection import get_db
from database.models_cmms import Machine, Worksheet, Part, InventoryLevel, PMTask
from api.auth import get_current_active_user
from api.schemas import ReportsSummaryDto

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/summary", response_model=ReportsSummaryDto)
async def get_reports_summary(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard summary statistics"""
    # Total machines
    machines_total = db.query(func.count(Machine.id)).scalar() or 0
    
    # Open worksheets (not completed or cancelled)
    worksheets_open = db.query(func.count(Worksheet.id)).filter(
        Worksheet.status.notin_(["COMPLETED", "CANCELLED"])
    ).scalar() or 0
    
    # Low stock items (quantity < min_stock_level)
    low_stock_query = db.query(
        func.count(Part.id)
    ).join(
        InventoryLevel, Part.id == InventoryLevel.part_id
    ).filter(
        InventoryLevel.quantity_on_hand < Part.safety_stock
    )
    inventory_low_stock = low_stock_query.scalar() or 0
    
    # PM tasks due this week
    week_start = datetime.now().date()
    week_end = week_start + timedelta(days=7)
    pm_due_this_week = db.query(func.count(PMTask.id)).filter(
        PMTask.next_due_date >= week_start,
        PMTask.next_due_date <= week_end,
        PMTask.is_active == True
    ).scalar() or 0
    
    return ReportsSummaryDto(
        machines_total=machines_total,
        worksheets_open=worksheets_open,
        inventory_low_stock=inventory_low_stock,
        pm_due_this_week=pm_due_this_week
    )

