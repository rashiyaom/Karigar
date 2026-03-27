#!/bin/bash

# MongoDB Atlas Setup Diagnostic Script
# This checks if your MongoDB Atlas is properly configured

echo "======================================"
echo "MongoDB Atlas Setup Diagnostic"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Configuration Check${NC}"
echo "======================================"
echo ""

# Check 1: MongoDB URI exists
echo "1️⃣  Checking MONGODB_URI..."
if [ -z "$MONGODB_URI" ]; then
    if grep -q "MONGODB_URI" .env.local 2>/dev/null; then
        echo -e "${YELLOW}⚠️  MONGODB_URI in .env.local but not in shell environment${NC}"
        echo "   Solution: Restart your terminal or run: source .env.local"
        MONGODB_URI=$(grep MONGODB_URI .env.local | cut -d '=' -f 2)
    else
        echo -e "${RED}✗ MONGODB_URI not found in .env.local${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ MONGODB_URI found${NC}"
fi
echo ""

# Check 2: Parse connection details
echo "2️⃣  Parsing connection details..."
URI=$MONGODB_URI
if [[ $URI == mongodb+srv://* ]]; then
    echo -e "${GREEN}✓ Using secure MongoDB+SRV connection${NC}"
    
    # Extract details
    USER=$(echo $URI | sed 's/.*:\/\/\([^:]*\):.*/\1/')
    PASS=$(echo $URI | sed 's/.*:\([^@]*\)@.*/\1/')
    HOST=$(echo $URI | sed 's/.*@\([^\/]*\).*/\1/')
    DB=$(echo $URI | sed 's/.*\/\([^?]*\).*/\1/')
    
    echo ""
    echo "Connection Details:"
    echo "  User: $USER"
    echo "  Host: $HOST"
    echo "  Database: $DB"
    echo "  TLS: ✅ Enabled (MongoDB+SRV)"
else
    echo -e "${RED}✗ Not using secure MongoDB+SRV connection${NC}"
    exit 1
fi
echo ""

# Check 3: Verify format
echo "3️⃣  Verifying connection string format..."
if [[ $HOST == *.mongodb.net ]]; then
    echo -e "${GREEN}✓ Using MongoDB Atlas (*.mongodb.net domain)${NC}"
else
    echo -e "${RED}✗ Invalid MongoDB Atlas hostname${NC}"
    exit 1
fi
echo ""

# Check 4: Check if server is running
echo "4️⃣  Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server is running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Dev server not running${NC}"
    echo "   Run: npm run dev"
    echo ""
    echo "After starting server, run this script again for full diagnosis"
    exit 0
fi
echo ""

# Check 5: Test MongoDB connection
echo "5️⃣  Testing MongoDB connection..."
HEALTH=$(curl -s http://localhost:3000/api/health)

if echo "$HEALTH" | jq . > /dev/null 2>&1; then
    IS_CONNECTED=$(echo "$HEALTH" | jq -r '.data.connection.isConnected' 2>/dev/null)
    
    if [ "$IS_CONNECTED" = "true" ]; then
        echo -e "${GREEN}✓ MongoDB connection successful!${NC}"
        
        # Show details
        READY_STATE=$(echo "$HEALTH" | jq -r '.data.connection.readyStateLabel' 2>/dev/null)
        COLLECTIONS=$(echo "$HEALTH" | jq -r '.data.collections | length' 2>/dev/null)
        
        echo ""
        echo "Connection Status:"
        echo "  Ready State: $READY_STATE"
        echo "  Collections: $COLLECTIONS"
        echo "  Host: $(echo "$HEALTH" | jq -r '.data.connection.host' 2>/dev/null)"
        echo "  Database: $(echo "$HEALTH" | jq -r '.data.connection.name' 2>/dev/null)"
    else
        echo -e "${RED}✗ MongoDB connection failed${NC}"
        
        # Provide help
        echo ""
        echo "Possible causes:"
        echo "  1. IP address not whitelisted in MongoDB Atlas"
        echo "  2. Database user credentials wrong"
        echo "  3. Network connection issue"
        echo ""
        echo "Solutions:"
        echo "  1. Add your IP to MongoDB Atlas:"
        echo "     https://cloud.mongodb.com/v2/*/security/network/accessList"
        echo ""
        echo "  2. Your public IP:"
        PUBIP=$(curl -s ifconfig.me)
        if [ ! -z "$PUBIP" ]; then
            echo "     $PUBIP"
        fi
        echo ""
        echo "  3. Full error details:"
        echo "$HEALTH" | jq '.error' 2>/dev/null || echo "$HEALTH"
    fi
else
    echo -e "${RED}✗ Health endpoint not responding${NC}"
    echo "  Response: $HEALTH"
fi
echo ""

# Check 6: Test CRUD operations
echo "6️⃣  Testing CRUD operations..."

# Get all employees
EMPLOYEES=$(curl -s http://localhost:3000/api/employees)
EMPLOYEE_COUNT=$(echo "$EMPLOYEES" | jq '.data | length' 2>/dev/null)

if [ ! -z "$EMPLOYEE_COUNT" ]; then
    echo -e "${GREEN}✓ Can read from MongoDB${NC}"
    echo "  Employees in database: $EMPLOYEE_COUNT"
else
    echo -e "${RED}✗ Cannot read from MongoDB${NC}"
fi
echo ""

# Summary
echo "======================================"
echo "📊 SUMMARY"
echo "======================================"
echo ""

if [ "$IS_CONNECTED" = "true" ]; then
    echo -e "${GREEN}✅ MongoDB Setup is CORRECT!${NC}"
    echo ""
    echo "You're ready to go! Run:"
    echo "  npm run dev"
    echo ""
    echo "Then test with:"
    echo "  ./verify-mongodb.sh"
else
    echo -e "${RED}❌ MongoDB Setup needs adjustment${NC}"
    echo ""
    echo "Quick fix:"
    echo "  1. Go to: https://cloud.mongodb.com/v2/*/security/network/accessList"
    echo "  2. Click 'Add IP Address'"
    echo "  3. Choose 'Current IP Address' or enter: 0.0.0.0/0"
    echo "  4. Confirm"
    echo "  5. Wait 2-3 minutes for changes to take effect"
    echo "  6. Run this script again"
fi
echo ""
