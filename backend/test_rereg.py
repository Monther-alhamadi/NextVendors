import requests
import json

url = "http://localhost:8100/api/v1/auth/register"
payload = {
    "username": "re_reg_test",
    "email": "rereg@example.com",
    "password": "Password123!"
}

print("Step 1: First registration")
r1 = requests.post(url, json=payload)
print(f"Status: {r1.status_code}, Body: {r1.text}")

print("\nStep 2: Second registration (should trigger delete/re-add)")
r2 = requests.post(url, json=payload)
print(f"Status: {r2.status_code}, Body: {r2.text}")
