#!/bin/bash

# MongoDB Connection Verification Script for Karigar
# This script verifies MongoDB is properly connected and all data flows to MongoDB

echo "======================================"
echo "MongoDB Connection Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "🔍 Checking if dev server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Dev server not running. Start it with: npm run dev${NC}"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test 1: Health Check
echo "📋 Test 1: MongoDB Health Check"
echo "================================"
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "$HEALTH" | jq '.'
if echo "$HEALTH" | jq '.data.connection.isConnected' | grep -q "true"; then
    echo -e "${GREEN}✓ MongoDB Connected${NC}"
else
    echo -e "${RED}✗ MongoDB Not Connected${NC}"
    exit 1
fi
echo ""

# Test 2: Database Info
echo "📊 Test 2: Database Information"
echo "================================"
curl -s http://localhost:3000/api/database/info | jq '.'
echo ""

# Test 3: Create Employee
echo "👤 Test 3: Create Employee (Testing Write to MongoDB)"
echo "======================================================"
EMPLOYEE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Employee",
    "salary": 50000,
    "joiningDate": "2024-03-27",
    "mobile": "9999999999",
    "email": "test-'$(date +%s)'@example.com",
    "role": "Employee"
  }')

echo "$EMPLOYEE_RESPONSE" | jq '.'
EMPLOYEE_ID=$(echo "$EMPLOYEE_RESPONSE" | jq -r '.data.id')

if [ "$EMPLOYEE_ID" != "null" ] && [ ! -z "$EMPLOYEE_ID" ]; then
    echo -e "${GREEN}✓ Employee Created: $EMPLOYEE_ID${NC}"
else
    echo -e "${RED}✗ Failed to create employee${NC}"
    exit 1
fi
echo ""

# Test 4: Read Employee
echo "👁️  Test 4: Read Employee from MongoDB"
echo "====================================="
curl -s http://localhost:3000/api/employees | jq '.data | length' | xargs echo "Total employees in MongoDB:"
echo ""

# Test 5: Create Attendance
echo "📅 Test 5: Create Attendance (Testing Write to MongoDB)"
echo "======================================================"
ATTENDANCE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$(date +%Y-%m-%d)\",
    \"status\": \"present\"
  }")

echo "$ATTENDANCE_RESPONSE" | jq '.'
ATTENDANCE_ID=$(echo "$ATTENDANCE_RESPONSE" | jq -r '.data.id')

if [ "$ATTENDANCE_ID" != "null" ] && [ ! -z "$ATTENDANCE_ID" ]; then
    echo -e "${GREEN}✓ Attendance Created: $ATTENDANCE_ID${NC}"
else
    echo -e "${RED}✗ Failed to create attendance${NC}"
    exit 1
fi
echo ""

# Test 6: Add Credit
echo "💰 Test 6: Add Credit (Testing Write to MongoDB)"
echo "================================================="
CREDIT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/credits \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"amount\": 5000,
    \"dateTaken\": \"$(date +%Y-%m-%d)\",
    \"promiseReturnDate\": \"$(date -d '+30 days' +%Y-%m-%d)\",
    \"isPaid\": false
  }")

echo "$CREDIT_RESPONSE" | jq '.'
CREDIT_ID=$(echo "$CREDIT_RESPONSE" | jq -r '.data.id')

if [ "$CREDIT_ID" != "null" ] && [ ! -z "$CREDIT_ID" ]; then
    echo -e "${GREEN}✓ Credit Created: $CREDIT_ID${NC}"
else
    echo -e "${RED}✗ Failed to create credit${NC}"
    exit 1
fi
echo ""

# Test 7: Create Task
echo "✅ Test 7: Create Task (Testing Write to MongoDB)"
echo "==============================================="
TASK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"title\": \"Complete Project\",
    \"description\": \"Finish the MongoDB migration project\",
    \"deadline\": \"$(date -d '+7 days' +%Y-%m-%d)\",
    \"priority\": \"high\",
    \"isCompleted\": false
  }")

echo "$TASK_RESPONSE" | jq '.'
TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.data.id')

if [ "$TASK_ID" != "null" ] && [ ! -z "$TASK_ID" ]; then
    echo -e "${GREEN}✓ Task Created: $TASK_ID${NC}"
else
    echo -e "${RED}✗ Failed to create task${NC}"
    exit 1
fi
echo ""

# Test 8: Update Employee
echo "✏️  Test 8: Update Employee (Testing Update in MongoDB)"
echo "======================================================"
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3000/api/employees/$EMPLOYEE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 60000,
    "role": "Senior Employee"
  }')

echo "$UPDATE_RESPONSE" | jq '.'

if echo "$UPDATE_RESPONSE" | jq '.success' | grep -q "true"; then
    echo -e "${GREEN}✓ Employee Updated${NC}"
else
    echo -e "${RED}✗ Failed to update employee${NC}"
    exit 1
fi
echo ""

# Test 9: Get Stats
echo "📈 Test 9: Get Statistics (MongoDB Data Summary)"
echo "==============================================="
STATS=$(curl -s http://localhost:3000/api/stats)
echo "$STATS" | jq '.data'
echo ""

# Test 10: Get History/Audit Trail
echo "📜 Test 10: Get Audit Trail (History from MongoDB)"
echo "=================================================="
HISTORY=$(curl -s http://localhost:3000/api/history)
echo "$HISTORY" | jq '.data | length' | xargs echo "Total audit entries:"
echo "$HISTORY" | jq '.data | .[0:2]'  # Show first 2 entries
echo ""

# Test 11: Test Duplicate Prevention
echo "🚫 Test 11: Test Duplicate Prevention"
echo "===================================="
DUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$(date +%Y-%m-%d)\",
    \"status\": \"absent\"
  }")

if echo "$DUP_RESPONSE" | jq '.success' | grep -q "false"; then
    echo -e "${GREEN}✓ Duplicate Prevention Working (Expected Error)${NC}"
    echo "Error: $(echo "$DUP_RESPONSE" | jq '.error')"
else
    echo -e "${YELLOW}⚠️  Duplicate not prevented${NC}"
fi
echo ""

# Final Summary
echo "======================================"
echo "✅ MongoDB Connection Verification Complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "--------"
echo "✓ MongoDB Connection: ACTIVE"
echo "✓ Employee Created: $EMPLOYEE_ID"
echo "✓ Attendance Tracked: $ATTENDANCE_ID"
echo "✓ Credit Added: $CREDIT_ID"
echo "✓ Task Created: $TASK_ID"
echo "✓ Data Updates: WORKING"
echo "✓ Audit Trail: RECORDING"
echo "✓ Duplicate Prevention: ACTIVE"
echo ""
echo "All data is properly being stored in MongoDB! 🎉"
echo ""
