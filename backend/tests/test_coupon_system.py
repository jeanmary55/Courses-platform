"""
Backend tests for Shalom Learning Coupon System
Tests: Coupon CRUD (admin), Coupon validation, Coupon application in checkout
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "jeanlusjeanmarysagehomme@gmail.com"
ADMIN_PASSWORD = "Bondye509@"
TEST_USER_EMAIL = "testcoupon@test.com"
TEST_USER_PASSWORD = "test123"


class TestCouponAdminCRUD:
    """Admin coupon management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_get_all_coupons(self, admin_token):
        """Test GET /api/admin/coupons - Get all coupons"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        coupons = response.json()
        assert isinstance(coupons, list), "Should return a list of coupons"
        print(f"Found {len(coupons)} existing coupons")
    
    def test_create_percentage_coupon(self, admin_token):
        """Test POST /api/admin/coupons - Create percentage discount coupon"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_PERCENT_{uuid.uuid4().hex[:6].upper()}"
        
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 15,
            "maxUses": 10,
            "active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=true"
        assert "couponId" in data, "Should return couponId"
        assert data["code"] == coupon_code.upper(), "Code should be uppercase"
        
        # Verify coupon was created
        coupons_response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        coupons = coupons_response.json()
        created_coupon = next((c for c in coupons if c["code"] == coupon_code.upper()), None)
        
        assert created_coupon is not None, "Coupon should exist"
        assert created_coupon["discountType"] == "percentage"
        assert created_coupon["discountValue"] == 15
        assert created_coupon["maxUses"] == 10
        assert created_coupon["active"] == True
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{data['couponId']}", headers=headers)
        print(f"Created and verified percentage coupon: {coupon_code}")
    
    def test_create_fixed_coupon(self, admin_token):
        """Test POST /api/admin/coupons - Create fixed value discount coupon"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_FIXED_{uuid.uuid4().hex[:6].upper()}"
        
        coupon_data = {
            "code": coupon_code,
            "discountType": "fixed",
            "discountValue": 50.00,
            "active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify
        coupons_response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        coupons = coupons_response.json()
        created_coupon = next((c for c in coupons if c["code"] == coupon_code.upper()), None)
        
        assert created_coupon is not None
        assert created_coupon["discountType"] == "fixed"
        assert created_coupon["discountValue"] == 50.00
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{data['couponId']}", headers=headers)
        print(f"Created and verified fixed coupon: {coupon_code}")
    
    def test_create_coupon_with_expiration(self, admin_token):
        """Test creating coupon with expiration date"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_EXPIRE_{uuid.uuid4().hex[:6].upper()}"
        
        # Set expiration to 7 days from now
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 20,
            "expiresAt": expires_at,
            "active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        coupon_id = data["couponId"]
        
        # Verify expiration was set
        coupons_response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        coupons = coupons_response.json()
        created_coupon = next((c for c in coupons if c["code"] == coupon_code.upper()), None)
        
        assert created_coupon is not None
        assert created_coupon["expiresAt"] is not None
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=headers)
        print(f"Created coupon with expiration: {coupon_code}")
    
    def test_create_coupon_with_max_uses(self, admin_token):
        """Test creating coupon with max uses limit"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_MAXUSE_{uuid.uuid4().hex[:6].upper()}"
        
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 10,
            "maxUses": 5,
            "active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        coupon_id = data["couponId"]
        
        # Verify
        coupons_response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        coupons = coupons_response.json()
        created_coupon = next((c for c in coupons if c["code"] == coupon_code.upper()), None)
        
        assert created_coupon["maxUses"] == 5
        assert created_coupon["currentUses"] == 0
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=headers)
        print(f"Created coupon with max uses: {coupon_code}")
    
    def test_toggle_coupon_active(self, admin_token):
        """Test PUT /api/admin/coupons/{id} - Toggle active status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_TOGGLE_{uuid.uuid4().hex[:6].upper()}"
        
        # Create active coupon
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 10,
            "active": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        coupon_id = create_response.json()["couponId"]
        
        # Deactivate
        update_response = requests.put(f"{BASE_URL}/api/admin/coupons/{coupon_id}", 
                                       json={"active": False}, headers=headers)
        assert update_response.status_code == 200
        
        # Verify deactivated
        coupons_response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        coupons = coupons_response.json()
        updated_coupon = next((c for c in coupons if c["id"] == coupon_id), None)
        assert updated_coupon["active"] == False
        
        # Reactivate
        update_response2 = requests.put(f"{BASE_URL}/api/admin/coupons/{coupon_id}", 
                                        json={"active": True}, headers=headers)
        assert update_response2.status_code == 200
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=headers)
        print(f"Toggled coupon active status: {coupon_code}")
    
    def test_delete_coupon(self, admin_token):
        """Test DELETE /api/admin/coupons/{id} - Delete coupon"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_DELETE_{uuid.uuid4().hex[:6].upper()}"
        
        # Create coupon
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 5,
            "active": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        coupon_id = create_response.json()["couponId"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deleted
        coupons_response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        coupons = coupons_response.json()
        deleted_coupon = next((c for c in coupons if c["id"] == coupon_id), None)
        assert deleted_coupon is None, "Coupon should be deleted"
        print(f"Deleted coupon: {coupon_code}")
    
    def test_duplicate_coupon_code_rejected(self, admin_token):
        """Test that duplicate coupon codes are rejected"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        coupon_code = f"TEST_DUP_{uuid.uuid4().hex[:6].upper()}"
        
        # Create first coupon
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 10,
            "active": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert create_response.status_code == 200
        coupon_id = create_response.json()["couponId"]
        
        # Try to create duplicate
        dup_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert dup_response.status_code == 400, "Duplicate code should be rejected"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=headers)
        print(f"Duplicate code rejection verified: {coupon_code}")


class TestCouponValidation:
    """Coupon validation endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def user_token(self):
        """Get or create test user token"""
        # Try login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            return login_response.json()["token"]
        
        # Create user if doesn't exist
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Coupon",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if signup_response.status_code == 200:
            return signup_response.json()["token"]
        
        pytest.skip("Could not get user token")
    
    @pytest.fixture
    def course_id(self):
        """Get first available course ID"""
        response = requests.get(f"{BASE_URL}/api/courses")
        courses = response.json()
        if len(courses) == 0:
            pytest.skip("No courses available")
        return courses[0]["id"]
    
    def test_validate_existing_coupon_teste10(self, user_token, course_id):
        """Test validating the existing TESTE10 coupon"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "TESTE10",
            "courseId": course_id
        }, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "TESTE10"
        assert data["discountType"] == "percentage"
        assert data["discountValue"] == 10
        assert "originalPrice" in data
        assert "discount" in data
        assert "finalPrice" in data
        assert data["discount"] > 0, "Discount should be calculated"
        assert data["finalPrice"] < data["originalPrice"], "Final price should be less than original"
        
        print(f"TESTE10 validation: Original={data['originalPrice']}, Discount={data['discount']}, Final={data['finalPrice']}")
    
    def test_validate_invalid_coupon(self, user_token, course_id):
        """Test validating non-existent coupon"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALID_CODE_12345",
            "courseId": course_id
        }, headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Invalid coupon correctly rejected with 404")
    
    def test_validate_inactive_coupon(self, admin_token, user_token, course_id):
        """Test validating inactive coupon"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        coupon_code = f"TEST_INACTIVE_{uuid.uuid4().hex[:6].upper()}"
        
        # Create inactive coupon
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 10,
            "active": False
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=admin_headers)
        coupon_id = create_response.json()["couponId"]
        
        # Try to validate
        validate_response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": coupon_code,
            "courseId": course_id
        }, headers=user_headers)
        
        assert validate_response.status_code == 400, f"Expected 400, got {validate_response.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=admin_headers)
        print(f"Inactive coupon correctly rejected: {coupon_code}")
    
    def test_validate_expired_coupon(self, admin_token, user_token, course_id):
        """Test validating expired coupon"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        coupon_code = f"TEST_EXPIRED_{uuid.uuid4().hex[:6].upper()}"
        
        # Create expired coupon (expired yesterday)
        expires_at = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 10,
            "expiresAt": expires_at,
            "active": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=admin_headers)
        coupon_id = create_response.json()["couponId"]
        
        # Try to validate
        validate_response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": coupon_code,
            "courseId": course_id
        }, headers=user_headers)
        
        assert validate_response.status_code == 400, f"Expected 400, got {validate_response.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=admin_headers)
        print(f"Expired coupon correctly rejected: {coupon_code}")
    
    def test_validate_coupon_requires_auth(self, course_id):
        """Test that coupon validation requires authentication"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "TESTE10",
            "courseId": course_id
        })
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Coupon validation correctly requires authentication")


class TestCouponInPayment:
    """Test coupon application in payment creation"""
    
    @pytest.fixture
    def user_token(self):
        """Get or create test user token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            return login_response.json()["token"]
        
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Coupon",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if signup_response.status_code == 200:
            return signup_response.json()["token"]
        
        pytest.skip("Could not get user token")
    
    @pytest.fixture
    def course_id(self):
        """Get first available course ID"""
        response = requests.get(f"{BASE_URL}/api/courses")
        courses = response.json()
        if len(courses) == 0:
            pytest.skip("No courses available")
        return courses[0]["id"]
    
    def test_create_payment_with_coupon(self, user_token, course_id):
        """Test POST /api/payments/create-preference with coupon code"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # First validate the coupon to get expected discount
        validate_response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "TESTE10",
            "courseId": course_id
        }, headers=headers)
        
        if validate_response.status_code != 200:
            pytest.skip("TESTE10 coupon not available")
        
        expected_discount = validate_response.json()["discount"]
        expected_final = validate_response.json()["finalPrice"]
        
        # Create payment with coupon
        payment_response = requests.post(f"{BASE_URL}/api/payments/create-preference", json={
            "courseId": course_id,
            "couponCode": "TESTE10"
        }, headers=headers)
        
        assert payment_response.status_code == 200, f"Expected 200, got {payment_response.status_code}: {payment_response.text}"
        
        data = payment_response.json()
        assert "preferenceId" in data, "Should return preferenceId"
        assert "initPoint" in data, "Should return initPoint"
        assert "originalPrice" in data, "Should return originalPrice"
        assert "discount" in data, "Should return discount"
        assert "finalPrice" in data, "Should return finalPrice"
        assert data["couponApplied"] == "TESTE10", "Should show applied coupon"
        
        # Verify discount was applied correctly
        assert abs(data["discount"] - expected_discount) < 0.01, f"Discount mismatch: {data['discount']} vs {expected_discount}"
        assert abs(data["finalPrice"] - expected_final) < 0.01, f"Final price mismatch: {data['finalPrice']} vs {expected_final}"
        
        print(f"Payment created with coupon: Original={data['originalPrice']}, Discount={data['discount']}, Final={data['finalPrice']}")
    
    def test_create_payment_without_coupon(self, user_token, course_id):
        """Test payment creation without coupon"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get course price
        course_response = requests.get(f"{BASE_URL}/api/courses/{course_id}")
        course_price = course_response.json()["price"]
        
        # Create payment without coupon
        payment_response = requests.post(f"{BASE_URL}/api/payments/create-preference", json={
            "courseId": course_id
        }, headers=headers)
        
        assert payment_response.status_code == 200
        
        data = payment_response.json()
        assert data["discount"] == 0, "No discount without coupon"
        assert data["finalPrice"] == data["originalPrice"], "Final should equal original"
        assert data["couponApplied"] is None, "No coupon applied"
        
        print(f"Payment created without coupon: Price={data['finalPrice']}")
    
    def test_create_payment_with_invalid_coupon(self, user_token, course_id):
        """Test payment creation with invalid coupon - should still work but without discount"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Create payment with invalid coupon
        payment_response = requests.post(f"{BASE_URL}/api/payments/create-preference", json={
            "courseId": course_id,
            "couponCode": "INVALID_COUPON_XYZ"
        }, headers=headers)
        
        # Should still create payment but without discount
        assert payment_response.status_code == 200, f"Expected 200, got {payment_response.status_code}"
        
        data = payment_response.json()
        assert data["discount"] == 0, "Invalid coupon should give no discount"
        assert data["couponApplied"] is None, "Invalid coupon should not be applied"
        
        print("Payment with invalid coupon created without discount")


class TestCouponSpecificRestrictions:
    """Test coupon restrictions (specific user, specific course)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def user_data(self):
        """Get or create test user and return token + id"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            return {"token": data["token"], "id": data["user"]["id"]}
        
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Coupon",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if signup_response.status_code == 200:
            data = signup_response.json()
            return {"token": data["token"], "id": data["user"]["id"]}
        
        pytest.skip("Could not get user data")
    
    @pytest.fixture
    def courses(self):
        """Get available courses"""
        response = requests.get(f"{BASE_URL}/api/courses")
        courses = response.json()
        if len(courses) < 2:
            pytest.skip("Need at least 2 courses for this test")
        return courses
    
    def test_coupon_specific_course_valid(self, admin_token, user_data, courses):
        """Test coupon restricted to specific course - valid use"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_data['token']}"}
        
        target_course_id = courses[0]["id"]
        coupon_code = f"TEST_COURSE_{uuid.uuid4().hex[:6].upper()}"
        
        # Create coupon for specific course
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 25,
            "specificCourseId": target_course_id,
            "active": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=admin_headers)
        coupon_id = create_response.json()["couponId"]
        
        # Validate for correct course
        validate_response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": coupon_code,
            "courseId": target_course_id
        }, headers=user_headers)
        
        assert validate_response.status_code == 200, f"Should work for target course: {validate_response.text}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=admin_headers)
        print(f"Course-specific coupon validated for correct course: {coupon_code}")
    
    def test_coupon_specific_course_invalid(self, admin_token, user_data, courses):
        """Test coupon restricted to specific course - invalid use on different course"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_data['token']}"}
        
        target_course_id = courses[0]["id"]
        other_course_id = courses[1]["id"]
        coupon_code = f"TEST_COURSE2_{uuid.uuid4().hex[:6].upper()}"
        
        # Create coupon for specific course
        coupon_data = {
            "code": coupon_code,
            "discountType": "percentage",
            "discountValue": 25,
            "specificCourseId": target_course_id,
            "active": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=admin_headers)
        coupon_id = create_response.json()["couponId"]
        
        # Try to validate for different course
        validate_response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": coupon_code,
            "courseId": other_course_id
        }, headers=user_headers)
        
        assert validate_response.status_code == 400, f"Should reject for wrong course: {validate_response.text}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=admin_headers)
        print(f"Course-specific coupon correctly rejected for wrong course: {coupon_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
