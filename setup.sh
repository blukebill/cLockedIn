#!/bin/bash

echo "installing frontend deps..."
cd frontend && npm install

echo "installing backend deps..."
cd ../backend/api && mvn clean install

echo "all deps installed"
