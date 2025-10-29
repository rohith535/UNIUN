# Notification Engine

This directory contains a notification engine built with Docker, LocalStack, DynamoDB, Lambda, SNS, and SQS.

## Prerequisites

- Docker
- Docker Compose
- AWS CLI

## Running the service

1.  **Start the services:**

    ```bash
    docker-compose up --build
    ```

2.  **Run the tests:**

    In a separate terminal, run the following command:

    ```bash
    ./test-pipeline.sh
    ```

## Troubleshooting

-   **Check the logs:**

    ```bash
    docker-compose -f ../docker-compose.yml -f docker-compose.notifications.yml logs -f
    ```

-   **Access LocalStack resources:**

    You can use the AWS CLI to interact with the LocalStack container. For example, to list the DynamoDB tables:

    ```bash
    aws dynamodb list-tables --endpoint-url http://localhost:4566
    ```
