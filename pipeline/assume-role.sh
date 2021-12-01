#!/bin/bash
ROLE=$1
SESSION_NAME=$2

AWS_ACCESS_KEY_ID=$PIPELINE_USER_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$PIPELINE_USER_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

cred=$(aws sts assume-role --role-arn "$ROLE" \
                           --role-session-name "$SESSION_NAME" \
                           --query '[Credentials.AccessKeyId,Credentials.SecretAccessKey,Credentials.SessionToken]' \
                           --output text)

export AWS_ACCESS_KEY_ID=$(echo "$cred" | awk '{ print $1 }')
export AWS_SECRET_ACCESS_KEY=$(echo "$cred" | awk '{ print $2 }')
export AWS_SESSION_TOKEN=$(echo "$cred" | awk '{ print $3 }')