#!/usr/bin/env python3
"""
Genera el archivo de credenciales de Workload Identity Federation
para autenticar gcloud en GitHub Actions sin Service Account keys.
"""
import json
import os
import sys

audience = "//iam.googleapis.com/projects/931070721639/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

token_url = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL")
token_token = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN")

if not token_url or not token_token:
    print("ERROR: ACTIONS_ID_TOKEN_REQUEST_URL o ACTIONS_ID_TOKEN_REQUEST_TOKEN no definidos")
    print("Asegurate de que el workflow tenga 'permissions: id-token: write'")
    sys.exit(1)

creds = {
    "type": "external_account",
    "audience": audience,
    "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
    "token_url": "https://sts.googleapis.com/v1/token",
    "service_account_impersonation_url": (
        "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/"
        "github-actions-demo@axel-ateam-demo.iam.gserviceaccount.com:generateAccessToken"
    ),
    "credential_source": {
        "url": f"{token_url}&audience={audience}",
        "headers": {"Authorization": f"Bearer {token_token}"},
        "format": {"type": "json", "subject_token_field_name": "value"},
    },
}

output_path = "/tmp/wif-creds.json"
with open(output_path, "w") as f:
    json.dump(creds, f, indent=2)

print(f"✅ Credential file generado: {output_path}")
