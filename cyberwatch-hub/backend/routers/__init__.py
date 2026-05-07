from .detect import router as detect
from .alerts import router as alerts
from .settings import router as settings
from .notifications import router as notifications
from .reports import router as reports

__all__ = ["detect", "alerts", "settings", "notifications", "reports"]
