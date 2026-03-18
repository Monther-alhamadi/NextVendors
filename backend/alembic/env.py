from logging.config import fileConfig
import os
import sys

# Ensure the backend root is on sys.path so both 'app' and 'backend.app'
# import paths resolve correctly regardless of the working directory.
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Import with fallback: inside Docker/Render the package is 'app',
# but locally it may be 'backend.app'.
try:
    from app.core.config import settings
    from app.core.database import Base
except ImportError:
    from backend.app.core.config import settings
    from backend.app.core.database import Base

from sqlalchemy import engine_from_config, pool
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

# target metadata for 'autogenerate'
target_metadata = Base.metadata

# Override sqlalchemy.url from settings (already normalized in config.py)
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
