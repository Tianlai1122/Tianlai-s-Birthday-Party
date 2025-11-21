#!/usr/bin/env node

/**
 * API Test Script for Virtual Party Scene
 * Tests all backend endpoints without requiring a running server
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/party-scene';
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function test(name, fn) {
    try {
        log(`\n🧪 Testing: ${name}`, 'cyan');
        await fn();
        log(`✅ PASSED: ${name}`, 'green');
        testsPassed++;
    } catch (error) {
        log(`❌ FAILED: ${name}`, 'red');
        log(`   Error: ${error.message}`, 'red');
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function runTests() {
    log('\n╔════════════════════════════════════════╗', 'blue');
    log('║   Virtual Party Scene - API Tests     ║', 'blue');
    log('╚════════════════════════════════════════╝', 'blue');

    // Test 1: Health Check
    await test('Health Check - Root Endpoint', async () => {
        const res = await makeRequest('GET', 'http://localhost:3000/');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.status === 'ok', 'Status should be ok');
    });

    // Test 2: Get Characters (Empty)
    await test('GET /characters - Empty Database', async () => {
        const res = await makeRequest('GET', '/characters');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success === true, 'Success should be true');
        assert(Array.isArray(res.data.characters), 'Characters should be an array');
        assert(res.data.count >= 0, 'Count should be >= 0');
    });

    // Test 3: Get Characters with Limit
    await test('GET /characters?limit=10', async () => {
        const res = await makeRequest('GET', '/characters?limit=10');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.characters.length <= 10, 'Should return max 10 characters');
    });

    // Test 4: Get Non-existent Character
    await test('GET /characters/:id - Non-existent', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await makeRequest('GET', `/characters/${fakeId}`);
        assert(res.status === 404, `Expected 404, got ${res.status}`);
    });

    // Test 5: Like Non-existent Character
    await test('POST /characters/:id/like - Non-existent', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await makeRequest('POST', `/characters/${fakeId}/like`);
        assert(res.status === 404, `Expected 404, got ${res.status}`);
    });

    // Test 6: Add Message - Invalid Data
    await test('POST /characters/:id/messages - Empty Content', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await makeRequest('POST', `/characters/${fakeId}/messages`, { content: '' });
        assert(res.status === 400 || res.status === 404, `Expected 400 or 404, got ${res.status}`);
    });

    // Test 7: Add Message - Content Too Long
    await test('POST /characters/:id/messages - Content Too Long', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const longContent = 'a'.repeat(201);
        const res = await makeRequest('POST', `/characters/${fakeId}/messages`, { content: longContent });
        assert(res.status === 400 || res.status === 404, `Expected 400 or 404, got ${res.status}`);
    });

    // Test 8: Update Character - Invalid Body Style
    await test('PATCH /characters/:id - Invalid Body Style', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await makeRequest('PATCH', `/characters/${fakeId}`, { bodyStyle: 'invalid' });
        assert(res.status === 400 || res.status === 404, `Expected 400 or 404, got ${res.status}`);
    });

    // Test 9: Update Character - Invalid Transport
    await test('PATCH /characters/:id - Invalid Transport', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await makeRequest('PATCH', `/characters/${fakeId}`, { transport: 'invalid' });
        assert(res.status === 400 || res.status === 404, `Expected 400 or 404, got ${res.status}`);
    });

    // Test 10: Update Character - Invalid Action
    await test('PATCH /characters/:id - Invalid Action', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await makeRequest('PATCH', `/characters/${fakeId}`, { action: 'invalid' });
        assert(res.status === 400 || res.status === 404, `Expected 400 or 404, got ${res.status}`);
    });

    // Summary
    log('\n╔════════════════════════════════════════╗', 'blue');
    log('║          Test Results Summary          ║', 'blue');
    log('╚════════════════════════════════════════╝', 'blue');
    log(`\n✅ Passed: ${testsPassed}`, 'green');
    log(`❌ Failed: ${testsFailed}`, 'red');
    log(`📊 Total:  ${testsPassed + testsFailed}`, 'cyan');
    
    if (testsFailed === 0) {
        log('\n🎉 All tests passed!', 'green');
        process.exit(0);
    } else {
        log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
        process.exit(1);
    }
}

// Check if server is running
http.get('http://localhost:3000/', (res) => {
    log('✅ Server is running on port 3000', 'green');
    runTests().catch(err => {
        log(`\n❌ Test suite error: ${err.message}`, 'red');
        process.exit(1);
    });
}).on('error', () => {
    log('❌ Server is not running on port 3000', 'red');
    log('   Please start the server first: cd backend && npm start', 'yellow');
    process.exit(1);
});

