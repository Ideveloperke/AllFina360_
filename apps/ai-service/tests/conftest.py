import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

os.environ["AI_SERVICE_API_KEY"] = "test-key"
os.environ.pop("ANTHROPIC_API_KEY", None)


@pytest.fixture
def client() -> Iterator[TestClient]:
    from app.config import get_settings
    from app.main import app

    get_settings.cache_clear()
    with TestClient(app) as c:
        yield c
