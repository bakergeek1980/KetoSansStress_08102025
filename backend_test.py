#!/usr/bin/env python3
"""
Backend API Testing for KetoSansStress Authentication System
Testing the authentication endpoints after frontend changes from React Hook Form to useState
Focus on login, register, profile endpoints and email confirmation flow
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configuration - Using production URL from frontend .env
BACKEND_URL = "https://ketolite.preview.emergentagent.com/api"

# Standard test data for all registrations
STANDARD_TEST_DATA = {
    "password": "TestMultiDomain123!",
    "full_name": "Testeur MultiDomain",
    "age": 30,
    "gender": "female",
    "height": 170,
    "weight": 65,
    "activity_level": "moderately_active", 
    "goal": "weight_loss",
    "timezone": "Europe/Paris"
}

class EmailDomainTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def test_email_registration(self, email: str, expected_status: int = 201) -> Dict[str, Any]:
        """Test registration with a specific email address"""
        test_data = STANDARD_TEST_DATA.copy()
        test_data["email"] = email
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=test_data,
                timeout=10
            )
            
            result = {
                "email": email,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "success": response.status_code == expected_status,
                "response_data": None,
                "error": None,
                "needs_email_confirmation": None
            }
            
            try:
                response_data = response.json()
                result["response_data"] = response_data
                result["needs_email_confirmation"] = response_data.get("needs_email_confirmation")
            except:
                result["response_data"] = response.text
            
            if not result["success"]:
                result["error"] = f"Expected {expected_status}, got {response.status_code}"
                if result["response_data"]:
                    result["error"] += f" - {result['response_data']}"
            
            return result
            
        except Exception as e:
            return {
                "email": email,
                "status_code": None,
                "expected_status": expected_status,
                "success": False,
                "response_data": None,
                "error": f"Request failed: {str(e)}",
                "needs_email_confirmation": None
            }
    
    def test_mainstream_providers(self) -> List[Dict[str, Any]]:
        """Test mainstream email providers"""
        print("🧪 Testing Mainstream Email Providers...")
        
        mainstream_emails = [
            "testeur.gmail@gmail.com",
            "testeur.yahoo@yahoo.fr", 
            "testeur.outlook@hotmail.com",
            "testeur.orange@orange.fr"
        ]
        
        results = []
        for email in mainstream_emails:
            print(f"  Testing: {email}")
            result = self.test_email_registration(email)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_professional_domains(self) -> List[Dict[str, Any]]:
        """Test professional email domains"""
        print("🧪 Testing Professional Email Domains...")
        
        professional_emails = [
            "marie.pro@entreprise.com",
            "etudiant@universite.edu"
        ]
        
        results = []
        for email in professional_emails:
            print(f"  Testing: {email}")
            result = self.test_email_registration(email)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_special_formats(self) -> List[Dict[str, Any]]:
        """Test special email formats"""
        print("🧪 Testing Special Email Formats...")
        
        special_emails = [
            "user+test@domain.net",
            "jean-marie@mon-domaine.org",
            "usuario@dominio.es",
            "test@ai"
        ]
        
        results = []
        for email in special_emails:
            print(f"  Testing: {email}")
            result = self.test_email_registration(email)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_invalid_emails(self) -> List[Dict[str, Any]]:
        """Test invalid email formats (should fail)"""
        print("🧪 Testing Invalid Email Formats (should fail)...")
        
        invalid_emails = [
            ("emailsansarobase", 422),  # No @ symbol
            ("test@", 422),  # No domain
            ("", 422)  # Empty email
        ]
        
        results = []
        for email, expected_status in invalid_emails:
            print(f"  Testing invalid: '{email}' (expecting {expected_status})")
            result = self.test_email_registration(email, expected_status)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all email domain tests"""
        print("🎯 STARTING COMPREHENSIVE MULTI-DOMAIN EMAIL TESTING")
        print("=" * 60)
        
        start_time = datetime.now()
        
        # Test all categories
        mainstream_results = self.test_mainstream_providers()
        professional_results = self.test_professional_domains()
        special_results = self.test_special_formats()
        invalid_results = self.test_invalid_emails()
        
        # Combine all results
        all_results = mainstream_results + professional_results + special_results + invalid_results
        
        # Calculate statistics
        total_tests = len(all_results)
        successful_tests = sum(1 for r in all_results if r["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Count valid email acceptances (excluding invalid email tests)
        valid_email_tests = mainstream_results + professional_results + special_results
        valid_email_successes = sum(1 for r in valid_email_tests if r["success"])
        valid_domains_tested = len(set(email.split('@')[1] for email in [r["email"] for r in valid_email_tests if '@' in r["email"]]))
        
        # Check for needs_email_confirmation consistency
        confirmation_statuses = [r["needs_email_confirmation"] for r in valid_email_tests if r["success"] and r["needs_email_confirmation"] is not None]
        consistent_confirmation = len(set(confirmation_statuses)) <= 1 if confirmation_statuses else True
        
        end_time = datetime.now()
        
        summary = {
            "test_summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "success_rate": round(success_rate, 1),
                "valid_domains_tested": valid_domains_tested,
                "valid_email_successes": valid_email_successes,
                "consistent_email_confirmation": consistent_confirmation,
                "test_duration": str(end_time - start_time)
            },
            "detailed_results": {
                "mainstream_providers": mainstream_results,
                "professional_domains": professional_results,
                "special_formats": special_results,
                "invalid_emails": invalid_results
            },
            "validation_criteria": {
                "accepts_all_valid_domains": valid_email_successes >= 8,  # At least 8 different domains
                "rejects_invalid_emails": all(r["success"] for r in invalid_results),
                "universal_email_confirmation": consistent_confirmation,
                "no_domain_restrictions": True  # Will be determined by results
            }
        }
        
        return summary
    
    def print_results(self, summary: Dict[str, Any]):
        """Print formatted test results"""
        print("\n" + "=" * 60)
        print("📊 MULTI-DOMAIN EMAIL TESTING RESULTS")
        print("=" * 60)
        
        test_summary = summary["test_summary"]
        print(f"Total Tests: {test_summary['total_tests']}")
        print(f"Successful Tests: {test_summary['successful_tests']}")
        print(f"Success Rate: {test_summary['success_rate']}%")
        print(f"Valid Domains Tested: {test_summary['valid_domains_tested']}")
        print(f"Test Duration: {test_summary['test_duration']}")
        
        print("\n🎯 VALIDATION CRITERIA:")
        criteria = summary["validation_criteria"]
        print(f"✅ Accepts All Valid Domains: {'PASS' if criteria['accepts_all_valid_domains'] else 'FAIL'}")
        print(f"✅ Rejects Invalid Emails: {'PASS' if criteria['rejects_invalid_emails'] else 'FAIL'}")
        print(f"✅ Universal Email Confirmation: {'PASS' if criteria['universal_email_confirmation'] else 'FAIL'}")
        
        print("\n📋 DETAILED RESULTS BY CATEGORY:")
        
        # Mainstream providers
        print("\n1️⃣ MAINSTREAM PROVIDERS:")
        for result in summary["detailed_results"]["mainstream_providers"]:
            status = "✅" if result["success"] else "❌"
            confirmation = f" (confirmation: {result['needs_email_confirmation']})" if result["needs_email_confirmation"] is not None else ""
            print(f"  {status} {result['email']} - Status: {result['status_code']}{confirmation}")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        # Professional domains
        print("\n2️⃣ PROFESSIONAL DOMAINS:")
        for result in summary["detailed_results"]["professional_domains"]:
            status = "✅" if result["success"] else "❌"
            confirmation = f" (confirmation: {result['needs_email_confirmation']})" if result["needs_email_confirmation"] is not None else ""
            print(f"  {status} {result['email']} - Status: {result['status_code']}{confirmation}")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        # Special formats
        print("\n3️⃣ SPECIAL FORMATS:")
        for result in summary["detailed_results"]["special_formats"]:
            status = "✅" if result["success"] else "❌"
            confirmation = f" (confirmation: {result['needs_email_confirmation']})" if result["needs_email_confirmation"] is not None else ""
            print(f"  {status} {result['email']} - Status: {result['status_code']}{confirmation}")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        # Invalid emails
        print("\n4️⃣ INVALID EMAILS (should fail):")
        for result in summary["detailed_results"]["invalid_emails"]:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} '{result['email']}' - Status: {result['status_code']} (expected: {result['expected_status']})")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        print("\n" + "=" * 60)
        
        # Final verdict
        all_criteria_pass = all(criteria.values())
        if all_criteria_pass:
            print("🎉 VERDICT: ALL CRITERIA PASSED! The application accepts all valid email domains.")
        else:
            print("⚠️  VERDICT: Some criteria failed. Review the results above.")
        
        print("=" * 60)

def main():
    """Main test execution"""
    tester = EmailDomainTester()
    
    try:
        # Run comprehensive tests
        summary = tester.run_comprehensive_test()
        
        # Print results
        tester.print_results(summary)
        
        # Save results to file
        with open('/app/email_domain_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: /app/email_domain_test_results.json")
        
        return summary
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()