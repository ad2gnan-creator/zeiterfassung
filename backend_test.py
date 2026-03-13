#!/usr/bin/env python3
"""
Backend Test Suite for NFC & QR-Code Login Features
Tests the newly implemented employee management and login endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://betriebsleiter-next.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_employee_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_employee_crud_with_nfc_qr(self):
        """Test Employee CRUD operations with NFC and QR fields"""
        print("\n=== Testing Employee CRUD with NFC/QR Fields ===")
        
        # Test 1: Create employee with NFC and QR codes
        employee_data = {
            "personalnummer": "TEST001",
            "vorname": "Max",
            "nachname": "Mustermann",
            "abteilung": "Holz",
            "nfc_chip_id": "TEST-NFC-12345",
            "qr_code": "TESTQR12"
        }
        
        success, response, status = self.make_request("POST", "/employees", employee_data)
        if success and "id" in response:
            self.test_employee_id = response["id"]
            self.log_test(
                "Create Employee with NFC/QR",
                True,
                f"Employee created successfully with ID: {self.test_employee_id}"
            )
        else:
            self.log_test(
                "Create Employee with NFC/QR",
                False,
                f"Failed to create employee",
                {"response": response, "status": status}
            )
            return False
        
        # Test 2: Get employees and verify new fields are returned
        success, response, status = self.make_request("GET", "/employees")
        if success and isinstance(response, list):
            found_employee = None
            for emp in response:
                if emp.get("id") == self.test_employee_id:
                    found_employee = emp
                    break
            
            if found_employee and "nfc_chip_id" in found_employee and "qr_code" in found_employee:
                self.log_test(
                    "GET Employees returns NFC/QR fields",
                    True,
                    "NFC and QR fields are properly returned"
                )
            else:
                self.log_test(
                    "GET Employees returns NFC/QR fields",
                    False,
                    "NFC/QR fields missing in response",
                    {"found_employee": found_employee}
                )
        else:
            self.log_test(
                "GET Employees returns NFC/QR fields",
                False,
                "Failed to get employees",
                {"response": response, "status": status}
            )
        
        # Test 3: Update employee NFC/QR fields
        update_data = {
            "nfc_chip_id": "UPDATED-NFC-67890",
            "qr_code": "UPDATEDQR34"
        }
        
        success, response, status = self.make_request("PUT", f"/employees/{self.test_employee_id}", update_data)
        if success and response.get("nfc_chip_id") == "UPDATED-NFC-67890":
            self.log_test(
                "Update Employee NFC/QR fields",
                True,
                "Employee NFC/QR fields updated successfully"
            )
        else:
            self.log_test(
                "Update Employee NFC/QR fields",
                False,
                "Failed to update employee NFC/QR fields",
                {"response": response, "status": status}
            )
        
        return True

    def test_validation_qr_code_length(self):
        """Test QR-Code length validation (minimum 8 characters)"""
        print("\n=== Testing QR-Code Length Validation ===")
        
        # Test 1: Create employee with QR code < 8 characters (should fail)
        short_qr_data = {
            "personalnummer": "TEST002",
            "vorname": "Anna",
            "nachname": "Test",
            "abteilung": "Kunststoff",
            "qr_code": "SHORT"  # Only 5 characters
        }
        
        success, response, status = self.make_request("POST", "/employees", short_qr_data)
        if not success and status == 400 and "8 Zeichen" in str(response):
            self.log_test(
                "QR-Code < 8 chars validation (CREATE)",
                True,
                "Correctly rejected QR-Code with < 8 characters"
            )
        else:
            self.log_test(
                "QR-Code < 8 chars validation (CREATE)",
                False,
                "Should have rejected short QR-Code",
                {"response": response, "status": status}
            )
        
        # Test 2: Update employee with QR code < 8 characters (should fail)
        if self.test_employee_id:
            short_qr_update = {"qr_code": "TINY"}  # Only 4 characters
            
            success, response, status = self.make_request("PUT", f"/employees/{self.test_employee_id}", short_qr_update)
            if not success and status == 400 and "8 Zeichen" in str(response):
                self.log_test(
                    "QR-Code < 8 chars validation (UPDATE)",
                    True,
                    "Correctly rejected QR-Code update with < 8 characters"
                )
            else:
                self.log_test(
                    "QR-Code < 8 chars validation (UPDATE)",
                    False,
                    "Should have rejected short QR-Code update",
                    {"response": response, "status": status}
                )

    def test_validation_uniqueness(self):
        """Test NFC-Chip-ID and QR-Code uniqueness validation"""
        print("\n=== Testing NFC/QR Uniqueness Validation ===")
        
        # Test 1: Try to create employee with duplicate NFC-Chip-ID
        duplicate_nfc_data = {
            "personalnummer": "TEST003",
            "vorname": "Bob",
            "nachname": "Duplicate",
            "abteilung": "Montage",
            "nfc_chip_id": "UPDATED-NFC-67890"  # Same as our test employee
        }
        
        success, response, status = self.make_request("POST", "/employees", duplicate_nfc_data)
        if not success and status == 400 and "bereits verwendet" in str(response):
            self.log_test(
                "Duplicate NFC-Chip-ID validation",
                True,
                "Correctly rejected duplicate NFC-Chip-ID"
            )
        else:
            self.log_test(
                "Duplicate NFC-Chip-ID validation",
                False,
                "Should have rejected duplicate NFC-Chip-ID",
                {"response": response, "status": status}
            )
        
        # Test 2: Try to create employee with duplicate QR-Code
        duplicate_qr_data = {
            "personalnummer": "TEST004",
            "vorname": "Charlie",
            "nachname": "Duplicate",
            "abteilung": "Verwaltung",
            "qr_code": "UPDATEDQR34"  # Same as our test employee
        }
        
        success, response, status = self.make_request("POST", "/employees", duplicate_qr_data)
        if not success and status == 400 and "bereits verwendet" in str(response):
            self.log_test(
                "Duplicate QR-Code validation",
                True,
                "Correctly rejected duplicate QR-Code"
            )
        else:
            self.log_test(
                "Duplicate QR-Code validation",
                False,
                "Should have rejected duplicate QR-Code",
                {"response": response, "status": status}
            )

    def test_nfc_login_endpoint(self):
        """Test NFC-Login endpoint"""
        print("\n=== Testing NFC-Login Endpoint ===")
        
        # Test 1: Valid NFC-Chip-ID login
        nfc_login_data = {"nfc_chip_id": "UPDATED-NFC-67890"}
        
        success, response, status = self.make_request("POST", "/nfc-login", nfc_login_data)
        if success and response.get("success") and "employee" in response:
            employee = response["employee"]
            if employee.get("personalnummer") == "TEST001":
                self.log_test(
                    "NFC-Login with valid chip ID",
                    True,
                    f"Successfully logged in employee: {employee.get('vorname')} {employee.get('nachname')}"
                )
            else:
                self.log_test(
                    "NFC-Login with valid chip ID",
                    False,
                    "Wrong employee returned",
                    {"employee": employee}
                )
        else:
            self.log_test(
                "NFC-Login with valid chip ID",
                False,
                "Failed to login with valid NFC-Chip-ID",
                {"response": response, "status": status}
            )
        
        # Test 2: Invalid NFC-Chip-ID login
        invalid_nfc_data = {"nfc_chip_id": "INVALID-NFC-99999"}
        
        success, response, status = self.make_request("POST", "/nfc-login", invalid_nfc_data)
        if success and not response.get("success"):
            self.log_test(
                "NFC-Login with invalid chip ID",
                True,
                "Correctly rejected invalid NFC-Chip-ID"
            )
        else:
            self.log_test(
                "NFC-Login with invalid chip ID",
                False,
                "Should have rejected invalid NFC-Chip-ID",
                {"response": response, "status": status}
            )
        
        # Test 3: Empty NFC-Chip-ID login
        empty_nfc_data = {"nfc_chip_id": ""}
        
        success, response, status = self.make_request("POST", "/nfc-login", empty_nfc_data)
        if success and not response.get("success"):
            self.log_test(
                "NFC-Login with empty chip ID",
                True,
                "Correctly rejected empty NFC-Chip-ID"
            )
        else:
            self.log_test(
                "NFC-Login with empty chip ID",
                False,
                "Should have rejected empty NFC-Chip-ID",
                {"response": response, "status": status}
            )

    def test_qr_login_endpoint(self):
        """Test QR-Login endpoint"""
        print("\n=== Testing QR-Login Endpoint ===")
        
        # Test 1: Valid QR-Code login (≥8 characters)
        qr_login_data = {"qr_code": "UPDATEDQR34"}
        
        success, response, status = self.make_request("POST", "/qr-login", qr_login_data)
        if success and response.get("success") and "employee" in response:
            employee = response["employee"]
            if employee.get("personalnummer") == "TEST001":
                self.log_test(
                    "QR-Login with valid code",
                    True,
                    f"Successfully logged in employee: {employee.get('vorname')} {employee.get('nachname')}"
                )
            else:
                self.log_test(
                    "QR-Login with valid code",
                    False,
                    "Wrong employee returned",
                    {"employee": employee}
                )
        else:
            self.log_test(
                "QR-Login with valid code",
                False,
                "Failed to login with valid QR-Code",
                {"response": response, "status": status}
            )
        
        # Test 2: Invalid QR-Code login
        invalid_qr_data = {"qr_code": "INVALIDQR999"}
        
        success, response, status = self.make_request("POST", "/qr-login", invalid_qr_data)
        if success and not response.get("success"):
            self.log_test(
                "QR-Login with invalid code",
                True,
                "Correctly rejected invalid QR-Code"
            )
        else:
            self.log_test(
                "QR-Login with invalid code",
                False,
                "Should have rejected invalid QR-Code",
                {"response": response, "status": status}
            )
        
        # Test 3: QR-Code too short (<8 characters)
        short_qr_data = {"qr_code": "SHORT"}
        
        success, response, status = self.make_request("POST", "/qr-login", short_qr_data)
        if success and not response.get("success") and "8 Zeichen" in str(response):
            self.log_test(
                "QR-Login with short code (<8 chars)",
                True,
                "Correctly rejected QR-Code < 8 characters"
            )
        else:
            self.log_test(
                "QR-Login with short code (<8 chars)",
                False,
                "Should have rejected short QR-Code",
                {"response": response, "status": status}
            )
        
        # Test 4: Empty QR-Code login
        empty_qr_data = {"qr_code": ""}
        
        success, response, status = self.make_request("POST", "/qr-login", empty_qr_data)
        if success and not response.get("success"):
            self.log_test(
                "QR-Login with empty code",
                True,
                "Correctly rejected empty QR-Code"
            )
        else:
            self.log_test(
                "QR-Login with empty code",
                False,
                "Should have rejected empty QR-Code",
                {"response": response, "status": status}
            )

    def cleanup_test_data(self):
        """Clean up test employee"""
        if self.test_employee_id:
            print(f"\n=== Cleaning up test employee {self.test_employee_id} ===")
            success, response, status = self.make_request("DELETE", f"/employees/{self.test_employee_id}")
            if success:
                print("✅ Test employee deleted successfully")
            else:
                print(f"⚠️  Failed to delete test employee: {response}")

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend Tests for NFC & QR-Code Login Features")
        print(f"Backend URL: {self.base_url}")
        print("=" * 80)
        
        try:
            # Run all test suites
            self.test_employee_crud_with_nfc_qr()
            self.test_validation_qr_code_length()
            self.test_validation_uniqueness()
            self.test_nfc_login_endpoint()
            self.test_qr_login_endpoint()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)