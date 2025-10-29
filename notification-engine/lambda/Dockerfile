# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install zip and any needed packages
RUN apk add --no-cache zip && npm install

# Copy the rest of the application source code
COPY . .

# Build the zip file
RUN npm run build
