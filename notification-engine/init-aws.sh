#!/bin/bash
echo "---"
echo "--- Configuring AWS resources ---"
echo "---"

# Set AWS region and endpoint URL
AWS_REGION="us-east-1"
AWS_ENDPOINT_URL="http://localhost:4566"

# DynamoDB table name
DYNAMODB_TABLE="notifications"
# SNS topic name
SNS_TOPIC="notification_topic"
# SQS queue name
SQS_QUEUE="notification_queue"

# Create DynamoDB table
echo "--- Creating DynamoDB table: $DYNAMODB_TABLE ---"
aws dynamodb create-table \
  --table-name $DYNAMODB_TABLE \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL

# Create SNS topic
echo "--- Creating SNS topic: $SNS_TOPIC ---"
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name $SNS_TOPIC \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL \
  --output text)
echo "--- SNS topic ARN: $SNS_TOPIC_ARN ---"

# Create SQS queue
echo "--- Creating SQS queue: $SQS_QUEUE ---"
SQS_QUEUE_URL=$(aws sqs create-queue \
  --queue-name $SQS_QUEUE \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL \
  --output text)
echo "--- SQS queue URL: $SQS_QUEUE_URL ---"

SQS_QUEUE_ARN=$(aws sqs get-queue-attributes \
  --queue-url $SQS_QUEUE_URL \
  --attribute-names QueueArn \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL \
  --output text | awk '{print $2}')
echo "--- SQS queue ARN: $SQS_QUEUE_ARN ---"

# Subscribe SQS queue to SNS topic
echo "--- Subscribing SQS queue to SNS topic ---"
aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol sqs \
  --notification-endpoint $SQS_QUEUE_ARN \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL

# Create Lambda function
echo "--- Creating Lambda function ---"
LAMBDA_FUNCTION_NAME="dynamodb-stream-processor"
aws lambda create-function \
  --function-name $LAMBDA_FUNCTION_NAME \
  --runtime nodejs18.x \
  --handler index.handler \
  --memory-size 128 \
  --zip-file fileb:///etc/localstack/init/ready.d/lambda/function.zip \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --environment "Variables={SNS_TOPIC_ARN=$SNS_TOPIC_ARN}" \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL

# Create event source mapping
echo "--- Creating event source mapping ---"
DYNAMODB_STREAM_ARN=$(aws dynamodb describe-table --table-name $DYNAMODB_TABLE --region $AWS_REGION --endpoint-url $AWS_ENDPOINT_URL | jq -r .Table.LatestStreamArn)
aws lambda create-event-source-mapping \
  --function-name $LAMBDA_FUNCTION_NAME \
  --event-source-arn $DYNAMODB_STREAM_ARN \
  --batch-size 1 \
  --starting-position LATEST \
  --region $AWS_REGION \
  --endpoint-url $AWS_ENDPOINT_URL
