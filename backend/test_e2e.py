import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, create_tables
from models import User, DeviceToken, PasswordReset, SearchLog

client = TestClient(app)

def run_tests():
    print("--- 1. Testing Root Endpoint ---")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] Root endpoint returned 200 OK")

    admin_user = os.getenv("ADMIN_USERNAME", "admin@college.edu")
    admin_pass = os.getenv("ADMIN_PASSWORD", "AdminPass123!")
    admin_login_res = client.post("/api/admin/login", json={"username": admin_user, "password": admin_pass})
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Admin login successful, token received")

    print("\n--- 3. Testing Admin Stats ---")
    stats_res = client.get("/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200, f"Admin stats failed: {stats_res.text}"
    print(f"[PASS] Admin stats: {stats_res.json()}")

    print("\n--- 4. Testing Student Registration ---")
    test_student = {
        "name": "Alice Johnson",
        "student_id": "STU1001",
        "email": "alice.johnson@college.edu",
        "password": "Password123!",
        "college_enroll_id": "ENR2026-99"
    }
    # Clean up student if already exists
    db = SessionLocal()
    existing_u = db.query(User).filter((User.student_id == test_student["student_id"]) | (User.email == test_student["email"])).first()
    if existing_u:
        db.delete(existing_u)
        db.commit()
    db.close()

    reg_res = client.post("/api/register", json=test_student)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    print(f"[PASS] Student registered with status: {reg_res.json()['status']}")

    print("\n--- 5. Testing Student Login Before Approval (Must be rejected with 403) ---")
    pre_approval_login = client.post("/api/login", json={
        "student_id": test_student["student_id"],
        "password": test_student["password"],
        "device_fingerprint": "fp_alice_laptop_1"
    })
    assert pre_approval_login.status_code == 403, f"Expected 403 pending approval, got {pre_approval_login.status_code}"
    print("[PASS] Pending student cannot login before admin approval")

    print("\n--- 6. Testing Admin Pending List & Student Approval ---")
    pending_res = client.get("/api/admin/pending-students", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_list = pending_res.json()["students"]
    target_student = next((s for s in pending_list if s["student_id"] == test_student["student_id"]), None)
    assert target_student is not None, "Registered student not in pending list"
    
    appr_res = client.post("/api/admin/approve-student", json={"user_id": target_student["id"]}, headers=admin_headers)
    assert appr_res.status_code == 200, f"Approval failed: {appr_res.text}"
    print(f"[PASS] Student approved by admin: {appr_res.json()['message']}")

    print("\n--- 7. Testing Approved Student Login on Device 1 ---")
    login_res = client.post("/api/login", json={
        "student_id": test_student["student_id"],
        "password": test_student["password"],
        "device_fingerprint": "fp_alice_laptop_1"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    student_token = login_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"[PASS] Student logged in successfully! User: {login_res.json()['user']['name']}")

    print("\n--- 8. Testing Device Lock (Attempting login on Device 2 -> Must be 403) ---")
    diff_device_login = client.post("/api/login", json={
        "student_id": test_student["student_id"],
        "password": test_student["password"],
        "device_fingerprint": "fp_alice_phone_unauthorized"
    })
    assert diff_device_login.status_code == 403, f"Expected 403 device lock, got {diff_device_login.status_code}"
    print(f"[PASS] Device lock enforced: {diff_device_login.json()['detail']}")

    print("\n--- 9. Testing Admin Device Reset ---")
    reset_dev_res = client.post("/api/admin/reset-device", json={"user_id": target_student["id"]}, headers=admin_headers)
    assert reset_dev_res.status_code == 200
    print(f"[PASS] Admin reset student device: {reset_dev_res.json()['message']}")

    # Now login with the phone device fingerprint should succeed
    phone_login = client.post("/api/login", json={
        "student_id": test_student["student_id"],
        "password": test_student["password"],
        "device_fingerprint": "fp_alice_phone_new"
    })
    assert phone_login.status_code == 200
    student_token = phone_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("[PASS] New device locked and logged in successfully after admin reset")

    print("\n--- 10. Testing Search API ---")
    search_res = client.get("/api/search?q=Massachusetts+Institute+of+Technology", headers=student_headers)
    assert search_res.status_code == 200, f"Search failed: {search_res.text}"
    search_data = search_res.json()
    print(f"[PASS] Search returned {len(search_data['results'])} results for query '{search_data['query']}'")
    for r in search_data['results'][:3]:
        print(f"       - [{r['source']}] {r['title']} -> {r['url']}")

    print("\n--- 11. Testing Search History ---")
    history_res = client.get("/api/search-history", headers=student_headers)
    assert history_res.status_code == 200
    hist_items = history_res.json()["history"]
    assert len(hist_items) >= 1, "Search was not recorded in history"
    print(f"[PASS] Search history recorded query: '{hist_items[0]['query']}' with {hist_items[0]['results_count']} results")

    print("\n--- 12. Testing Forgot Password / OTP / Reset Password Flow ---")
    forgot_res = client.post("/api/forgot-password", json={"email": test_student["email"]})
    assert forgot_res.status_code == 200
    
    # Retrieve OTP directly from DB
    db = SessionLocal()
    reset_rec = db.query(PasswordReset).filter(PasswordReset.user_id == target_student["id"], PasswordReset.is_used == False).order_by(PasswordReset.created_at.desc()).first()
    assert reset_rec is not None, "PasswordReset record not found"
    otp_code = reset_rec.otp_code
    db.close()
    print(f"[PASS] OTP generated for password reset: {otp_code}")

    verify_otp_res = client.post("/api/verify-otp", json={"email": test_student["email"], "otp_code": otp_code})
    assert verify_otp_res.status_code == 200
    print("[PASS] OTP verified successfully")

    reset_pw_res = client.post("/api/reset-password", json={"email": test_student["email"], "otp_code": otp_code, "new_password": "NewSecretPassword2026!"})
    assert reset_pw_res.status_code == 200
    print("[PASS] Password reset successfully")

    # Login with new password
    new_login = client.post("/api/login", json={
        "student_id": test_student["student_id"],
        "password": "NewSecretPassword2026!",
        "device_fingerprint": "fp_alice_phone_new"
    })
    assert new_login.status_code == 200
    print("[PASS] Student logged in with NEW password!")

    print("\n==========================================")
    print(" ALL END-TO-END TESTS PASSED SUCCESSFULLY! ")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
