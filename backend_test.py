import requests
import sys
import json
from datetime import datetime
import base64
import os

class ShalomLearningAPITester:
    def __init__(self, base_url="https://course-hub-164.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        request_headers = {'Content-Type': 'application/json'}
        
        if headers:
            request_headers.update(headers)
        
        if self.token and 'Authorization' not in request_headers:
            request_headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            details = ""
            
            if not success:
                details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if success and response.content else {}, response

        except Exception as e:
            error_msg = str(e)
            self.log_test(name, False, error_msg)
            print(f"   Error: {error_msg}")
            return False, {}, None

    def test_health_check(self):
        """Test basic API health"""
        success, response, _ = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_signup(self):
        """Test user signup"""
        test_timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{test_timestamp}@shalom.com"
        
        success, response, _ = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data={
                "firstName": "João",
                "lastName": "Silva",
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login - using existing user from signup"""
        # First create a user to login
        test_timestamp = datetime.now().strftime('%H%M%S') + "2"
        test_email = f"test_user_{test_timestamp}@shalom.com"
        
        # Create user first
        signup_success, signup_response, _ = self.run_test(
            "Create User for Login Test",
            "POST",
            "auth/signup",
            200,
            data={
                "firstName": "Maria",
                "lastName": "Santos",
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if not signup_success:
            return False
        
        # Now test login
        success, response, _ = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if success and 'token' in response:
            print(f"   Login token obtained: {response['token'][:20]}...")
            return True
        return False

    def test_get_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("Get User Profile", False, "No auth token available")
            return False
        
        success, response, _ = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   User: {response.get('firstName')} {response.get('lastName')}")
            return True
        return False

    def test_get_courses(self):
        """Test getting all courses"""
        success, response, _ = self.run_test(
            "Get All Courses",
            "GET",
            "courses",
            200
        )
        
        if success:
            courses_count = len(response)
            print(f"   Found {courses_count} courses")
            if courses_count == 10:  # Expected 10 courses (6 tech + 4 language)
                return True
            else:
                self.log_test("Course Count Validation", False, f"Expected 10 courses, got {courses_count}")
        return success

    def test_get_courses_by_category(self):
        """Test filtering courses by category"""
        # Test Technology category
        tech_success, tech_response, _ = self.run_test(
            "Get Technology Courses",
            "GET",
            "courses?category=Tecnologia",
            200
        )
        
        if tech_success:
            tech_count = len(tech_response)
            print(f"   Found {tech_count} technology courses")
        
        # Test Language category
        lang_success, lang_response, _ = self.run_test(
            "Get Language Courses",
            "GET",
            "courses?category=Idiomas",
            200
        )
        
        if lang_success:
            lang_count = len(lang_response)
            print(f"   Found {lang_count} language courses")
        
        return tech_success and lang_success

    def test_get_single_course(self):
        """Test getting a specific course"""
        success, response, _ = self.run_test(
            "Get Single Course",
            "GET",
            "courses/python-basics",
            200
        )
        
        if success:
            lessons_count = len(response.get('lessons', []))
            print(f"   Course: {response.get('title')}")
            print(f"   Lessons: {lessons_count}")
            if lessons_count == 20:
                return True
            else:
                self.log_test("Lesson Count Validation", False, f"Expected 20 lessons, got {lessons_count}")
        return success

    def test_get_nonexistent_course(self):
        """Test getting a non-existent course (should fail with 404)"""
        success, response, _ = self.run_test(
            "Get Non-existent Course",
            "GET",
            "courses/nonexistent-course",
            404
        )
        return success

    def test_create_payment(self):
        """Test creating a payment (PIX)"""
        if not self.token:
            self.log_test("Create Payment", False, "No auth token available")
            return False
        
        # Create a mock base64 receipt data
        receipt_data = base64.b64encode(b"Mock receipt image data").decode()
        
        success, response, _ = self.run_test(
            "Create Payment",
            "POST",
            "payments/create",
            200,
            data={
                "courseId": "python-basics",
                "receiptData": f"data:image/jpeg;base64,{receipt_data}"
            }
        )
        
        if success:
            print(f"   Payment ID: {response.get('paymentId')}")
            return True
        return success

    def test_get_my_courses(self):
        """Test getting user's purchased courses"""
        if not self.token:
            self.log_test("Get My Courses", False, "No auth token available")
            return False
        
        success, response, _ = self.run_test(
            "Get My Courses",
            "GET",
            "my-courses",
            200
        )
        
        if success:
            courses_count = len(response)
            print(f"   User has {courses_count} purchased courses")
            return True
        return success

    def test_unauthenticated_access(self):
        """Test accessing protected endpoints without authentication"""
        # Remove token temporarily
        temp_token = self.token
        self.token = None
        
        # Test accessing my courses without auth
        success, response, _ = self.run_test(
            "Unauthenticated Access to My Courses",
            "GET",
            "my-courses",
            401,
            headers={}
        )
        
        # Test creating payment without auth
        auth_success, _, _ = self.run_test(
            "Unauthenticated Payment Creation",
            "POST",
            "payments/create",
            401,
            data={"courseId": "python-basics", "receiptData": "test"},
            headers={}
        )
        
        # Restore token
        self.token = temp_token
        
        return success and auth_success

    def test_invalid_signup_data(self):
        """Test signup with invalid data"""
        # Test with invalid email
        invalid_email_success, _, _ = self.run_test(
            "Signup with Invalid Email",
            "POST",
            "auth/signup",
            422,  # Validation error
            data={
                "firstName": "Test",
                "lastName": "User",
                "email": "invalid-email",
                "password": "password123"
            }
        )
        
        # Test with duplicate email (if user exists)
        if self.user_id:
            test_email = f"test_user_{datetime.now().strftime('%H%M%S')}_dup@shalom.com"
            # Create user first
            requests.post(f"{self.api_url}/auth/signup", json={
                "firstName": "First",
                "lastName": "User",
                "email": test_email,
                "password": "password123"
            })
            
            # Try to create duplicate
            duplicate_success, _, _ = self.run_test(
                "Signup with Duplicate Email",
                "POST",
                "auth/signup",
                400,
                data={
                    "firstName": "Second",
                    "lastName": "User",
                    "email": test_email,
                    "password": "password123"
                }
            )
        else:
            duplicate_success = True  # Skip if no user created
        
        return invalid_email_success and duplicate_success

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print(f"📊 TEST SUMMARY")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "="*60)
        return self.tests_passed == self.tests_run

def main():
    print("🚀 Starting Shalom Learning API Tests")
    print("="*60)
    
    tester = ShalomLearningAPITester()
    
    # Run all tests
    test_methods = [
        ('Basic Health Check', tester.test_health_check),
        ('User Signup', tester.test_signup),
        ('User Login', tester.test_login),
        ('Get User Profile', tester.test_get_profile),
        ('Get All Courses', tester.test_get_courses),
        ('Filter Courses by Category', tester.test_get_courses_by_category),
        ('Get Single Course Details', tester.test_get_single_course),
        ('Get Non-existent Course', tester.test_get_nonexistent_course),
        ('Create Payment', tester.test_create_payment),
        ('Get My Courses', tester.test_get_my_courses),
        ('Unauthenticated Access', tester.test_unauthenticated_access),
        ('Invalid Signup Data', tester.test_invalid_signup_data),
    ]
    
    print(f"\nRunning {len(test_methods)} test categories...\n")
    
    for test_name, test_func in test_methods:
        try:
            print(f"\n📋 {test_name}")
            print("-" * 50)
            test_func()
        except Exception as e:
            print(f"❌ {test_name}: CRITICAL ERROR - {str(e)}")
            tester.log_test(test_name, False, f"Critical error: {str(e)}")
    
    # Print final summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())