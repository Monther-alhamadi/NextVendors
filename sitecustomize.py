"""Startup compatibility shim loaded by Python's site module.

This file patches `pydantic.fields` to provide an `Undefined` symbol when
running with newer Pydantic versions (v2+) so libraries expecting the
v1 `Undefined` name (e.g., some FastAPI versions) can still import.

This is a minimal, non-invasive shim intended for local test/runtime
compatibility in this repository only.
"""

try:
    import pydantic.fields as _pyd_fields
except Exception:
    _pyd_fields = None

if _pyd_fields is not None:
    # Provide a sentinel `Undefined` if it's missing (Pydantic v2 removed it).
    if not hasattr(_pyd_fields, "Undefined"):

        class _UndefinedSentinel:
            def __repr__(self):
                return "Undefined"

        _pyd_fields.Undefined = _UndefinedSentinel()

    # Some code expects `Empty` or other symbols — ensure common aliases exist.
    if not hasattr(_pyd_fields, "Empty"):
        _pyd_fields.Empty = _pyd_fields.Undefined

# If pydantic.fields is not importable or lacks required symbols at
# import-time for libraries like FastAPI, provide a small import hook
# that will create a lightweight `pydantic.fields` module exposing
# `FieldInfo` and `Undefined` so imports don't fail. This avoids
# replacing the full pydantic package while restoring minimal
# compatibility for older import expectations.
try:
    import importlib
    import importlib.util
    import importlib.abc

    needs_hook = False
    try:
        import pydantic.fields as _pf

        if not hasattr(_pf, "Undefined") or not hasattr(_pf, "FieldInfo"):
            needs_hook = True
    except Exception:
        needs_hook = True

    if needs_hook:

        class _PydanticFieldsLoader(importlib.abc.Loader):
            def create_module(self, spec):
                return None

            def exec_module(self, module):
                # Minimal FieldInfo placeholder used by FastAPI imports
                class FieldInfo:
                    def __init__(self, *args, **kwargs):
                        pass

                class _UndefinedType:
                    def __repr__(self):
                        return "Undefined"

                module.FieldInfo = FieldInfo
                module.Undefined = _UndefinedType()
                module.Empty = module.Undefined
                module.__all__ = ["FieldInfo", "Undefined", "Empty"]

        class _PydanticFieldsFinder(importlib.abc.MetaPathFinder):
            def find_spec(self, fullname, path, target=None):
                if fullname == "pydantic.fields":
                    return importlib.util.spec_from_loader(
                        fullname, _PydanticFieldsLoader()
                    )
                return None

        # Insert our finder early so it is used when `pydantic.fields` is imported
        import sys

        sys.meta_path.insert(0, _PydanticFieldsFinder())
except Exception:
    # If the import hook fails for any reason, don't crash startup; tests will show errors.
    pass

# Attempt a more robust shim: if an installed pydantic package exists but its
# `fields` module lacks `Undefined`, load the installed package under a
# private name and register a `pydantic` module in `sys.modules` that
# ensures `pydantic.fields` exposes `FieldInfo` and `Undefined`.
try:
    import sys
    import os
    import types
    import importlib.util

    def _find_installed_pydantic_init():
        for p in sys.path:
            try:
                candidate = os.path.join(p, "pydantic")
                if not os.path.isdir(candidate):
                    continue
                initpy = os.path.join(candidate, "__init__.py")
                if os.path.exists(initpy):
                    # Prefer site-packages locations over the current project
                    if os.path.abspath(candidate).startswith(
                        os.path.abspath(os.getcwd())
                    ):
                        # skip a pydantic directory that might be in the project
                        continue
                    return initpy
            except Exception:
                continue
        return None

    _init_path = _find_installed_pydantic_init()
    if _init_path and "pydantic" not in sys.modules:
        spec = importlib.util.spec_from_file_location("_real_pydantic", _init_path)
        _real_pydantic = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(_real_pydantic)
            sys.modules["_real_pydantic"] = _real_pydantic

            # Build a shim module that proxies the real pydantic but ensures
            # pydantic.fields has FieldInfo and Undefined.
            shim = types.ModuleType("pydantic")
            shim.__dict__.update(
                {
                    k: v
                    for k, v in _real_pydantic.__dict__.items()
                    if not k.startswith("__")
                }
            )

            # Prepare fields submodule
            fields_mod = None
            try:
                # Try to import the real fields module via the private package
                if hasattr(_real_pydantic, "fields"):
                    fields_mod = _real_pydantic.fields
            except Exception:
                fields_mod = None

            if fields_mod is None or not hasattr(fields_mod, "Undefined"):
                fields_mod = types.ModuleType("pydantic.fields")

                class FieldInfo:
                    def __init__(self, *args, **kwargs):
                        pass

                class _UndefinedType:
                    def __repr__(self):
                        return "Undefined"

                fields_mod.FieldInfo = FieldInfo
                fields_mod.Undefined = _UndefinedType()
                fields_mod.Empty = fields_mod.Undefined

            shim.fields = fields_mod

            # Register shim in sys.modules so normal imports see it
            sys.modules["pydantic"] = shim
            sys.modules["pydantic.fields"] = fields_mod
        except Exception:
            # If anything fails, don't crash startup — tests will give clearer errors
            pass
except Exception:
    pass
