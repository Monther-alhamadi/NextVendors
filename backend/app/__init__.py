"""
backend app package

Small compatibility shim: some code imports the package as `app` while
other code imports it as `backend.app`. To avoid duplicated module
objects and duplicate SQLAlchemy base instances during development,
alias the package name if needed so both import paths resolve to the
same module object.
"""

import sys
import importlib

# If this package is imported as 'backend.app' ensure there's also a
# top-level 'app' alias so modules that import `app` refer to the same
# package object. This prevents duplicated SQLAlchemy Base instances.
if __name__ == "backend.app":
    if "app" not in sys.modules:
        sys.modules["app"] = sys.modules[__name__]

    # Also alias the submodule name 'app.models' to 'backend.app.models'
    # so code that imports 'app.models' checks the same module object and
    # avoids circular import / duplicate registry issues.
    if "backend.app.models" in sys.modules:
        sys.modules["app.models"] = sys.modules["backend.app.models"]
    else:
        try:
            mod = importlib.import_module("backend.app.models")
            sys.modules["app.models"] = mod
        except Exception:
            # best-effort alias; if it fails, mapping will still work via
            # regular imports and we'll rely on explicit module paths.
            pass
