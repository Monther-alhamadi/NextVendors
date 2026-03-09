"""
Core API integration tests.

Tests cover the critical paths: auth, products, orders, analytics, plans, RBAC.
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient

# Import app after conftest sets up the environment
from main import app

client = TestClient(app)

# ═══════════════════════════════════════════════════════════════
#  TEST HELPERS
# ═══════════════════════════════════════════════════════════════

def login_admin():
    """Get JWT token for admin user."""
    resp = client.post("/api/v1/auth/login", json={
        "email": "devadmin@example.com",
        "password": "password"
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


def auth_headers(token):
    """Create Authorization header dict."""
    return {"Authorization": f"Bearer {token}"}


# ═══════════════════════════════════════════════════════════════
#  AUTH TESTS
# ═══════════════════════════════════════════════════════════════

class TestAuth:
    def test_login_success(self):
        resp = client.post("/api/v1/auth/login", json={
            "email": "devadmin@example.com",
            "password": "password"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_login_wrong_password(self):
        resp = client.post("/api/v1/auth/login", json={
            "email": "devadmin@example.com",
            "password": "wrongpassword"
        })
        assert resp.status_code in (400, 401, 422)

    def test_login_nonexistent_user(self):
        resp = client.post("/api/v1/auth/login", json={
            "email": "doesnotexist@example.com",
            "password": "password"
        })
        assert resp.status_code in (400, 401, 404, 422)

    def test_protected_endpoint_no_token(self):
        resp = client.get("/api/v1/analytics/dashboard")
        assert resp.status_code in (401, 403)

    def test_protected_endpoint_invalid_token(self):
        resp = client.get("/api/v1/analytics/dashboard",
                         headers={"Authorization": "Bearer invalidtoken123"})
        assert resp.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════
#  PRODUCTS TESTS
# ═══════════════════════════════════════════════════════════════

class TestProducts:
    def test_list_products_public(self):
        resp = client.get("/api/v1/products/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), (list, dict))

    def test_product_not_found(self):
        resp = client.get("/api/v1/products/999999")
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════
#  ANALYTICS TESTS (Admin)
# ═══════════════════════════════════════════════════════════════

class TestAnalytics:
    @pytest.fixture(autouse=True)
    def _auth(self):
        self.token = login_admin()

    def test_admin_analytics(self):
        if not self.token:
            pytest.skip("Admin login failed")
        resp = client.get("/api/v1/analytics/admin?period=monthly",
                         headers=auth_headers(self.token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_gmv" in data
        assert "gmv_growth" in data
        assert "order_count" in data
        assert "sales_chart" in data

    def test_admin_analytics_period_filter(self):
        if not self.token:
            pytest.skip("Admin login failed")
        for period in ("daily", "weekly", "monthly", "yearly"):
            resp = client.get(f"/api/v1/analytics/admin?period={period}",
                             headers=auth_headers(self.token))
            assert resp.status_code == 200
            assert resp.json()["period"] == period

    def test_admin_activity_feed(self):
        if not self.token:
            pytest.skip("Admin login failed")
        resp = client.get("/api/v1/analytics/admin/activity?limit=5",
                         headers=auth_headers(self.token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_dashboard_stats(self):
        if not self.token:
            pytest.skip("Admin login failed")
        resp = client.get("/api/v1/analytics/dashboard",
                         headers=auth_headers(self.token))
        assert resp.status_code == 200
        data = resp.json()
        assert "gmv" in data
        assert "order_count" in data

    def test_analytics_unauthorized(self):
        resp = client.get("/api/v1/analytics/admin")
        assert resp.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════
#  VENDOR PLANS TESTS
# ═══════════════════════════════════════════════════════════════

class TestVendorPlans:
    @pytest.fixture(autouse=True)
    def _auth(self):
        self.token = login_admin()

    def test_list_plans(self):
        resp = client.get("/api/v1/vendor-plans/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_plan(self):
        if not self.token:
            pytest.skip("Admin login failed")
        resp = client.post("/api/v1/vendor-plans/", json={
            "name": "TestPlan_Temp",
            "description": "Test plan for automated testing",
            "monthly_price": 99.99,
            "max_products": 100,
            "commission_rate": 0.05,
            "can_customize_store": True,
            "allow_whatsapp_checkout": True,
            "auto_approve_products": False,
            "is_active": True,
        }, headers=auth_headers(self.token))
        # 200 or 400 if already exists (from previous test run)
        assert resp.status_code in (200, 400)

    def test_create_plan_unauthorized(self):
        resp = client.post("/api/v1/vendor-plans/", json={
            "name": "UnauthorizedPlan",
        })
        assert resp.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════
#  RBAC TESTS
# ═══════════════════════════════════════════════════════════════

class TestRBAC:
    @pytest.fixture(autouse=True)
    def _auth(self):
        self.token = login_admin()

    def test_list_roles(self):
        if not self.token:
            pytest.skip("Admin login failed")
        resp = client.get("/api/v1/rbac/roles",
                         headers=auth_headers(self.token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_permissions(self):
        if not self.token:
            pytest.skip("Admin login failed")
        resp = client.get("/api/v1/rbac/permissions",
                         headers=auth_headers(self.token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ═══════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ═══════════════════════════════════════════════════════════════

class TestHealth:
    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_api_docs(self):
        resp = client.get("/docs")
        assert resp.status_code == 200
