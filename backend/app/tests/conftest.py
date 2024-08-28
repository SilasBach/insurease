import os

import pytest


@pytest.fixture(scope="session", autouse=True)
def set_test_environment():
    os.environ["ENVIRONMENT"] = "test"
    yield
    os.environ["ENVIRONMENT"] = "dev"
    # Optional: Reset the environment variable after tests
    # os.environ.pop("ENVIRONMENT", None)
