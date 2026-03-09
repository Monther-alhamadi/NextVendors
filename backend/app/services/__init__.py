from .base_service import BaseService

# Avoid importing all service submodules at package import time. Importing
# submodules (e.g. `from app.services.user_service import UserService`) will
# still execute this file, so keep it minimal to prevent cascading import
# errors when some model files are not present.
__all__ = ["BaseService"]
