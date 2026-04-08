"""Telemetry endpoints: event logging and error reporting."""

import logging

from fastapi import APIRouter, Request

from src.api.rate_limit import STANDARD_RATE, limiter
from src.api.schemas import TelemetryErrorRequest, TelemetryEventRequest, TelemetryResponse
from src.telemetry.logger import log_event

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/telemetry/event", response_model=TelemetryResponse)
@limiter.limit(STANDARD_RATE)
async def telemetry_event(request: Request, body: TelemetryEventRequest) -> TelemetryResponse:
    """Log a telemetry event. Always returns ok=True."""
    log_event(body.event_type, body.player_id, body.case_id, body.data)
    return TelemetryResponse(ok=True)


@router.post("/telemetry/error", response_model=TelemetryResponse)
@limiter.limit(STANDARD_RATE)
async def telemetry_error(request: Request, body: TelemetryErrorRequest) -> TelemetryResponse:
    """Log a frontend error. Always returns ok=True."""
    log_event(
        "error",
        body.player_id,
        body.case_id,
        {"error_type": body.error_type, "message": body.message, **body.context},
    )
    return TelemetryResponse(ok=True)
