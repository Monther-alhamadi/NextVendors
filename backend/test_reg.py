import requests
import json

url = "http://localhost:8100/api/v1/auth/register"
payload = {
    "username": "test_script_user",
    "email": "script@example.com",
    "password": "Password123!"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
