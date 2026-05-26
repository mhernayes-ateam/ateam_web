#!/usr/bin/env bash
# ============================================================
# Axel · A Team — Setup GCP desde cero
# Ejecutar UNA sola vez para crear toda la infraestructura de demo.
#
# Uso:
#   chmod +x infra/scripts/setup-gcp.sh
#   ./infra/scripts/setup-gcp.sh
# ============================================================

set -euo pipefail

# ── CONFIGURACIÓN ─────────────────────────────────────────────
PROJECT_ID="axel-ateam-demo"
REGION="us-east1"
ZONE="us-east1-b"
DB_INSTANCE="axel-db-demo"
BUCKET="axel-ateam-storage-demo"
QUEUE="axel-queue-demo"
SA_NAME="github-actions-demo"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     Axel · A Team — Setup GCP Demo  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. PROYECTO ───────────────────────────────────────────────
echo "1/9 Creando proyecto GCP: $PROJECT_ID"
gcloud projects create "$PROJECT_ID" --name="Axel A Team Demo" || echo "  (proyecto ya existe)"
gcloud config set project "$PROJECT_ID"

# Habilitar billing (manual — requiere ir a la consola si no está habilitado)
echo "  ⚠️  Acordate de habilitar el billing en: https://console.cloud.google.com/billing"
echo "  Presioná Enter cuando esté habilitado..."
read -r

# ── 2. APIs ───────────────────────────────────────────────────
echo "2/9 Habilitando APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudtasks.googleapis.com \
  firestore.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com \
  --quiet

echo "  ✅ APIs habilitadas"

# ── 3. ARTIFACT REGISTRY ──────────────────────────────────────
echo "3/9 Creando Artifact Registry..."
gcloud artifacts repositories create axel \
  --repository-format=docker \
  --location="$REGION" \
  --description="Imágenes Docker de Axel" \
  --quiet || echo "  (ya existe)"

echo "  ✅ Artifact Registry: $REGION-docker.pkg.dev/$PROJECT_ID/axel"

# ── 4. CLOUD SQL ──────────────────────────────────────────────
echo "4/9 Creando Cloud SQL (PostgreSQL 15)..."
gcloud sql instances create "$DB_INSTANCE" \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region="$REGION" \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --quiet || echo "  (ya existe)"

# Crear base de datos
gcloud sql databases create axel \
  --instance="$DB_INSTANCE" \
  --quiet || echo "  (db ya existe)"

# Crear usuario
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create axel-user \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD" \
  --quiet || echo "  (usuario ya existe)"

echo "  ✅ Cloud SQL: $DB_INSTANCE"
echo "  ⚠️  Guardá esta contraseña → Secret Manager automáticamente"

# Guardar en Secret Manager
echo "$DB_PASSWORD" | gcloud secrets create "db-password-demo" --data-file=- --quiet 2>/dev/null || \
  echo "$DB_PASSWORD" | gcloud secrets versions add "db-password-demo" --data-file=- --quiet

# ── 5. FIRESTORE ──────────────────────────────────────────────
echo "5/9 Creando Firestore (modo nativo)..."
gcloud firestore databases create \
  --location="$REGION" \
  --quiet || echo "  (ya existe)"

echo "  ✅ Firestore creado"

# ── 6. CLOUD STORAGE ──────────────────────────────────────────
echo "6/9 Creando Cloud Storage bucket..."
gcloud storage buckets create "gs://$BUCKET" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --quiet || echo "  (ya existe)"

echo "  ✅ Bucket: gs://$BUCKET"

# ── 7. CLOUD TASKS ────────────────────────────────────────────
echo "7/9 Creando Cloud Tasks queue..."
gcloud tasks queues create "$QUEUE" \
  --location="$REGION" \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=5 \
  --max-attempts=5 \
  --min-backoff=10s \
  --max-backoff=300s \
  --quiet || echo "  (ya existe)"

echo "  ✅ Queue: $QUEUE"

# ── 8. VM PARA CHATWOOT ───────────────────────────────────────
echo "8/9 Creando VM para Chatwoot..."
gcloud compute instances create chatwoot-vm \
  --machine-type=e2-standard-2 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server \
  --zone="$ZONE" \
  --quiet || echo "  (ya existe)"

# Abrir puertos
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80,tcp:443,tcp:3000 \
  --target-tags=http-server,https-server \
  --quiet || echo "  (firewall ya existe)"

VM_IP=$(gcloud compute instances describe chatwoot-vm --zone="$ZONE" --format='value(networkInterfaces[0].accessConfigs[0].natIP)')
echo "  ✅ VM: $VM_IP"

# ── 9. SERVICE ACCOUNT PARA GITHUB ACTIONS ───────────────────
echo "9/9 Creando Service Account para GitHub Actions..."
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_NAME" \
  --display-name="GitHub Actions Deploy Demo" \
  --quiet || echo "  (ya existe)"

# Asignar roles necesarios
for ROLE in \
  roles/run.admin \
  roles/storage.admin \
  roles/artifactregistry.admin \
  roles/iam.serviceAccountUser \
  roles/cloudtasks.admin \
  roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet
done

# Generar key para GitHub Actions
gcloud iam service-accounts keys create key.json \
  --iam-account="$SA_EMAIL" \
  --quiet

echo "  ✅ Service Account: $SA_EMAIL"
echo "  📁 Key guardada en: key.json"
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETADO ✅                   ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  PRÓXIMOS PASOS:                                         ║"
echo "║                                                          ║"
echo "║  1. Ir a GitHub repo → Settings → Secrets:              ║"
echo "║     • GCP_PROJECT_ID_DEMO = $PROJECT_ID"
echo "║     • GCP_SA_KEY_DEMO = contenido de key.json            ║"
echo "║     • CHATWOOT_URL_DEMO = https://chatwoot.tu-dominio    ║"
echo "║     • Resto de secrets según la documentación           ║"
echo "║                                                          ║"
echo "║  2. En GCP → Secret Manager, agregar:                   ║"
echo "║     • anthropic-api-key                                  ║"
echo "║     • meta-access-token-demo                             ║"
echo "║     • meta-verify-token-demo                             ║"
echo "║     • chatwoot-token-demo                                ║"
echo "║     • db-host-demo (IP de Cloud SQL)                    ║"
echo "║     • db-name-demo = axel                                ║"
echo "║     • db-user-demo = axel-user                          ║"
echo "║     • gcs-bucket-demo = $BUCKET"
echo "║                                                          ║"
echo "║  3. Instalar Chatwoot en la VM ($VM_IP):               ║"
echo "║     gcloud compute ssh chatwoot-vm --zone=$ZONE         ║"
echo "║                                                          ║"
echo "║  4. Ejecutar el schema SQL:                              ║"
echo "║     psql -h [IP_SQL] -U axel-user -d axel \\             ║"
echo "║       -f infra/sql/001_schema.sql                        ║"
echo "║       -f infra/sql/002_seeds.sql                         ║"
echo "║                                                          ║"
echo "║  5. ¡Borrar key.json! (nunca commitear)                  ║"
echo "║     rm key.json                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
