#!/bin/bash
set -e

PROJECT_ID="cloudex-dev"
REGION="europe-west1"
REPO="procurement-repo"
IMAGE="procurement-agent"
SERVICE="procurement-agent"

echo "🚀 Deploying Backend (ProducerAgent) to Cloud Run..."

# 1. Build
echo "Building Docker image..."
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest ./ProducerAgent

# 2. Push
echo "Pushing image to Artifact Registry..."
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest

# 3. Deploy
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest \
  --region $REGION \
  --project $PROJECT_ID

echo "✅ Backend deployed successfully!"
