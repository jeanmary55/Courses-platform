"""
Backend tests for Shalom Learning Admin Panel
Tests: Admin login, Course CRUD, User Management, Lesson Management
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "jeanlusjeanmarysagehomme@gmail.com"
ADMIN_PASSWORD = "Bondye509@"

class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "email" in data, "Response should contain email"
        assert data["email"] == ADMIN_EMAIL
        assert len(data["token"]) > 0, "Token should not be empty"
    
    def test_admin_login_invalid_email(self):
        """Test admin login with invalid email"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@email.com",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminDashboard:
    """Admin dashboard statistics tests"""
    
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
    
    def test_get_admin_stats(self, admin_token):
        """Test GET /api/admin/stats - Dashboard statistics"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify all required fields are present
        assert "totalUsers" in data, "Should have totalUsers field"
        assert "totalRevenue" in data, "Should have totalRevenue field"
        assert "approvedPayments" in data, "Should have approvedPayments field"
        assert "totalPayments" in data, "Should have totalPayments field"
        
        # Verify types
        assert isinstance(data["totalUsers"], int), "totalUsers should be int"
        assert isinstance(data["totalRevenue"], (int, float)), "totalRevenue should be numeric"
        assert isinstance(data["approvedPayments"], int), "approvedPayments should be int"


class TestAdminCourses:
    """Admin course management tests"""
    
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
    
    def test_get_all_courses_admin(self, admin_token):
        """Test GET /api/admin/courses - Should return ALL courses including unpublished"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/courses", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        courses = response.json()
        
        assert isinstance(courses, list), "Should return a list of courses"
        
        # Verify course structure
        if len(courses) > 0:
            course = courses[0]
            assert "id" in course, "Course should have id"
            assert "title" in course, "Course should have title"
            assert "category" in course, "Course should have category"
            assert "price" in course, "Course should have price"
            assert "published" in course, "Course should have published status"
            assert "lessonsCount" in course, "Course should have lessonsCount"
    
    def test_get_public_courses_only_published(self):
        """Test GET /api/courses - Should only return PUBLISHED courses"""
        response = requests.get(f"{BASE_URL}/api/courses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        courses = response.json()
        
        # All returned courses should be published
        for course in courses:
            assert course.get("published", True) == True, f"Course {course.get('id')} should be published"
    
    def test_create_course(self, admin_token):
        """Test POST /api/admin/courses - Create new course"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        test_course = {
            "title": f"TEST_Curso Teste {uuid.uuid4().hex[:8]}",
            "category": "Tecnologia",
            "description": "Curso criado para testes automatizados",
            "price": 99.99,
            "thumbnail": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
            "published": False
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/courses", json=test_course, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=true"
        assert "courseId" in data, "Should return courseId"
        
        # Store for cleanup
        course_id = data["courseId"]
        
        # Verify course was created - GET it back
        courses_response = requests.get(f"{BASE_URL}/api/admin/courses", headers=headers)
        courses = courses_response.json()
        created_course = next((c for c in courses if c["id"] == course_id), None)
        
        assert created_course is not None, f"Created course {course_id} should exist"
        assert created_course["title"] == test_course["title"]
        assert created_course["price"] == test_course["price"]
        assert created_course["published"] == test_course["published"]
        
        # Cleanup - delete the test course
        requests.delete(f"{BASE_URL}/api/admin/courses/{course_id}", headers=headers)
    
    def test_update_course(self, admin_token):
        """Test PUT /api/admin/courses/{id} - Update course"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a test course
        test_course = {
            "title": f"TEST_Update Course {uuid.uuid4().hex[:8]}",
            "category": "Tecnologia",
            "description": "Original description",
            "price": 100.00,
            "published": True
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/courses", json=test_course, headers=headers)
        course_id = create_response.json()["courseId"]
        
        # Update the course
        update_data = {
            "title": "TEST_Updated Title",
            "price": 149.99,
            "description": "Updated description"
        }
        update_response = requests.put(f"{BASE_URL}/api/admin/courses/{course_id}", json=update_data, headers=headers)
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify update - GET it back
        courses_response = requests.get(f"{BASE_URL}/api/admin/courses", headers=headers)
        courses = courses_response.json()
        updated_course = next((c for c in courses if c["id"] == course_id), None)
        
        assert updated_course["title"] == update_data["title"]
        assert updated_course["price"] == update_data["price"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/courses/{course_id}", headers=headers)
    
    def test_toggle_publish(self, admin_token):
        """Test PUT /api/admin/courses/{id}/publish - Toggle publish status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test course as published
        test_course = {
            "title": f"TEST_Publish Toggle {uuid.uuid4().hex[:8]}",
            "category": "Idiomas",
            "description": "Test publish toggle",
            "price": 50.00,
            "published": True
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/courses", json=test_course, headers=headers)
        course_id = create_response.json()["courseId"]
        
        # Toggle publish (should become unpublished)
        toggle_response = requests.put(f"{BASE_URL}/api/admin/courses/{course_id}/publish", headers=headers)
        assert toggle_response.status_code == 200
        assert toggle_response.json()["published"] == False
        
        # Toggle again (should become published)
        toggle_response2 = requests.put(f"{BASE_URL}/api/admin/courses/{course_id}/publish", headers=headers)
        assert toggle_response2.status_code == 200
        assert toggle_response2.json()["published"] == True
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/courses/{course_id}", headers=headers)
    
    def test_delete_course(self, admin_token):
        """Test DELETE /api/admin/courses/{id} - Delete course"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test course
        test_course = {
            "title": f"TEST_Delete Course {uuid.uuid4().hex[:8]}",
            "category": "Tecnologia",
            "description": "To be deleted",
            "price": 25.00,
            "published": False
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/courses", json=test_course, headers=headers)
        course_id = create_response.json()["courseId"]
        
        # Delete the course
        delete_response = requests.delete(f"{BASE_URL}/api/admin/courses/{course_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion - GET should not find it
        courses_response = requests.get(f"{BASE_URL}/api/admin/courses", headers=headers)
        courses = courses_response.json()
        deleted_course = next((c for c in courses if c["id"] == course_id), None)
        assert deleted_course is None, "Course should be deleted"


class TestAdminUsers:
    """Admin user management tests"""
    
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
    def test_user_id(self, admin_token):
        """Create a test user and return its ID"""
        # Signup a test user
        test_email = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "TEST",
            "lastName": "User",
            "email": test_email,
            "password": "testpassword123"
        })
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        return signup_response.json()["user"]["id"]
    
    def test_get_all_users(self, admin_token):
        """Test GET /api/admin/users - Get all users"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        users = response.json()
        
        assert isinstance(users, list), "Should return a list"
        
        # Verify user structure if users exist
        if len(users) > 0:
            user = users[0]
            assert "id" in user, "User should have id"
            assert "firstName" in user, "User should have firstName"
            assert "lastName" in user, "User should have lastName"
            assert "email" in user, "User should have email"
            assert "purchasedCourses" in user, "User should have purchasedCourses"
    
    def test_grant_free_access(self, admin_token, test_user_id):
        """Test POST /api/admin/users/grant-access - Grant free course access"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get first available course
        courses_response = requests.get(f"{BASE_URL}/api/admin/courses", headers=headers)
        courses = courses_response.json()
        if len(courses) == 0:
            pytest.skip("No courses available for testing")
        
        course_id = courses[0]["id"]
        
        # Grant access
        response = requests.post(f"{BASE_URL}/api/admin/users/grant-access", json={
            "userId": test_user_id,
            "courseId": course_id
        }, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.json()["success"] == True
        
        # Verify user has access - GET user and check purchasedCourses
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        test_user = next((u for u in users if u["id"] == test_user_id), None)
        
        assert test_user is not None
        assert course_id in test_user.get("purchasedCourses", []), "User should have course access"
        
        # Cleanup - delete user
        requests.delete(f"{BASE_URL}/api/admin/users/{test_user_id}", headers=headers)
    
    def test_revoke_access(self, admin_token, test_user_id):
        """Test POST /api/admin/users/revoke-access - Revoke course access"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get first course
        courses_response = requests.get(f"{BASE_URL}/api/admin/courses", headers=headers)
        courses = courses_response.json()
        if len(courses) == 0:
            pytest.skip("No courses available")
        course_id = courses[0]["id"]
        
        # First grant access
        requests.post(f"{BASE_URL}/api/admin/users/grant-access", json={
            "userId": test_user_id,
            "courseId": course_id
        }, headers=headers)
        
        # Now revoke access
        revoke_response = requests.post(f"{BASE_URL}/api/admin/users/revoke-access", json={
            "userId": test_user_id,
            "courseId": course_id
        }, headers=headers)
        
        assert revoke_response.status_code == 200
        assert revoke_response.json()["success"] == True
        
        # Verify access was revoked
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        test_user = next((u for u in users if u["id"] == test_user_id), None)
        
        assert course_id not in test_user.get("purchasedCourses", []), "User should not have course access"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{test_user_id}", headers=headers)
    
    def test_delete_user(self, admin_token):
        """Test DELETE /api/admin/users/{id} - Delete user"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user to delete
        test_email = f"delete_test_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "DeleteTest",
            "lastName": "User",
            "email": test_email,
            "password": "testpassword123"
        })
        user_id = signup_response.json()["user"]["id"]
        
        # Delete the user
        delete_response = requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        deleted_user = next((u for u in users if u["id"] == user_id), None)
        assert deleted_user is None, "User should be deleted"


class TestAdminLessons:
    """Admin lesson management tests"""
    
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
    def test_course_id(self, admin_token):
        """Create a test course and return its ID"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        course_data = {
            "title": f"TEST_Lesson Course {uuid.uuid4().hex[:8]}",
            "category": "Tecnologia",
            "description": "Course for lesson tests",
            "price": 100.00,
            "published": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/courses", json=course_data, headers=headers)
        return response.json()["courseId"]
    
    def test_add_lesson(self, admin_token, test_course_id):
        """Test POST /api/admin/lessons/add - Add lesson with YouTube URL"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        lesson_data = {
            "courseId": test_course_id,
            "title": "TEST_Lesson: Introduction",
            "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "pdfUrl": "https://example.com/lesson1.pdf",
            "duration": "15:30",
            "order": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/lessons/add", json=lesson_data, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "lessonId" in data
        
        # Verify lesson was added - GET lessons for course
        lessons_response = requests.get(f"{BASE_URL}/api/admin/lessons/{test_course_id}", headers=headers)
        lessons = lessons_response.json()
        
        assert len(lessons) == 1, "Should have 1 lesson"
        assert lessons[0]["title"] == lesson_data["title"]
        assert "youtube.com/embed" in lessons[0]["videoUrl"], "YouTube URL should be converted to embed"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/lessons/{data['lessonId']}", headers=headers)
        requests.delete(f"{BASE_URL}/api/admin/courses/{test_course_id}", headers=headers)
    
    def test_delete_lesson(self, admin_token, test_course_id):
        """Test DELETE /api/admin/lessons/{id} - Delete lesson"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a lesson first
        lesson_data = {
            "courseId": test_course_id,
            "title": "TEST_Delete Lesson",
            "videoUrl": "https://youtu.be/dQw4w9WgXcQ",
            "duration": "10:00",
            "order": 1
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/lessons/add", json=lesson_data, headers=headers)
        lesson_id = create_response.json()["lessonId"]
        
        # Delete the lesson
        delete_response = requests.delete(f"{BASE_URL}/api/admin/lessons/{lesson_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion
        lessons_response = requests.get(f"{BASE_URL}/api/admin/lessons/{test_course_id}", headers=headers)
        lessons = lessons_response.json()
        assert len(lessons) == 0, "Should have no lessons after deletion"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/courses/{test_course_id}", headers=headers)
    
    def test_get_course_lessons(self, admin_token, test_course_id):
        """Test GET /api/admin/lessons/{course_id} - Get all lessons for a course"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Add multiple lessons
        for i in range(3):
            lesson_data = {
                "courseId": test_course_id,
                "title": f"TEST_Lesson {i+1}",
                "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "duration": f"{10+i}:00",
                "order": i + 1
            }
            requests.post(f"{BASE_URL}/api/admin/lessons/add", json=lesson_data, headers=headers)
        
        # Get all lessons
        response = requests.get(f"{BASE_URL}/api/admin/lessons/{test_course_id}", headers=headers)
        
        assert response.status_code == 200
        lessons = response.json()
        
        assert len(lessons) == 3, f"Should have 3 lessons, got {len(lessons)}"
        
        # Verify ordering
        for i, lesson in enumerate(lessons):
            assert lesson["order"] == i + 1, "Lessons should be ordered"
        
        # Cleanup
        for lesson in lessons:
            requests.delete(f"{BASE_URL}/api/admin/lessons/{lesson['id']}", headers=headers)
        requests.delete(f"{BASE_URL}/api/admin/courses/{test_course_id}", headers=headers)


class TestAdminProtectedEndpoints:
    """Test that admin endpoints are protected"""
    
    def test_admin_stats_without_token(self):
        """Admin stats should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403], "Should be unauthorized"
    
    def test_admin_courses_without_token(self):
        """Admin courses should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/courses")
        assert response.status_code in [401, 403], "Should be unauthorized"
    
    def test_admin_users_without_token(self):
        """Admin users should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403], "Should be unauthorized"
    
    def test_non_admin_cannot_access_admin_endpoints(self):
        """Regular user token should not access admin endpoints"""
        # Create a regular user
        test_email = f"regular_user_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Regular",
            "lastName": "User",
            "email": test_email,
            "password": "password123"
        })
        
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        user_token = signup_response.json()["token"]
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to access admin endpoint
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 403, "Regular user should get 403 on admin endpoints"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
