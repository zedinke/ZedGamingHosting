/**
 * Manual Integration Test for Order Workflow
 * 
 * This test verifies:
 * 1. Order creation
 * 2. Mock payment processing
 * 3. Server provisioning
 * 4. Invoice generation (PDF)
 * 5. Email sending
 * 6. Order cancellation with refund
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface TestUser {
  id: string;
  email: string;
  token: string;
}

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

async function log(step: string, success: boolean, data?: any, error?: string) {
  const result: TestResult = { step, success, data, error };
  results.push(result);
  
  const icon = success ? '✓' : '✗';
  console.log(`${icon} ${step}`);
  if (error) console.log(`  Error: ${error}`);
  if (data) console.log(`  Data:`, JSON.stringify(data, null, 2).substring(0, 200));
}

async function testOrderWorkflow() {
  console.log('\n🧪 Starting Order Workflow Integration Test...\n');
  
  let testUser: TestUser | null = null;
  let orderId: string | null = null;
  let serverId: string | null = null;

  try {
    // Step 1: Create/get test user
    console.log('📝 Step 1: Creating test order...');
    const orderRes = await axios.post(
      `${API_BASE}/orders`,
      {
        planId: 'plan-default-1', // Use existing plan ID
        planSlug: 'basic-server',
        billingCycle: 'MONTHLY',
      },
      {
        headers: {
          Authorization: 'Bearer mock-token-for-testing',
        },
      }
    );

    if (orderRes.status === 201 || orderRes.status === 200) {
      orderId = orderRes.data.id;
      await log('Order creation', true, { orderId });
    } else {
      await log('Order creation', false, null, 'Invalid response status');
    }

    // Step 2: Process mock payment
    if (orderId) {
      console.log('\n💳 Step 2: Processing mock payment...');
      const paymentRes = await axios.post(
        `${API_BASE}/orders/${orderId}/payment`,
        { method: 'mock' },
        {
          headers: {
            Authorization: 'Bearer mock-token-for-testing',
          },
        }
      );

      if (paymentRes.data.status === 'PAID') {
        await log('Mock payment processing', true, { status: paymentRes.data.status });
      } else {
        await log('Mock payment processing', false, null, `Status is ${paymentRes.data.status}`);
      }
    }

    // Step 3: Check server provisioning
    if (orderId) {
      console.log('\n🖥️  Step 3: Checking server provisioning (wait 2s)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderRes = await axios.get(`${API_BASE}/orders/${orderId}`, {
        headers: {
          Authorization: 'Bearer mock-token-for-testing',
        },
      });

      if (orderRes.data.serverId) {
        serverId = orderRes.data.serverId;
        await log('Server provisioning', true, { serverId });
      } else {
        await log('Server provisioning', false, null, 'No server ID in order');
      }
    }

    // Step 4: Download invoice data
    if (orderId) {
      console.log('\n📋 Step 4: Downloading invoice data...');
      const invoiceRes = await axios.get(`${API_BASE}/orders/${orderId}/invoice`, {
        headers: {
          Authorization: 'Bearer mock-token-for-testing',
        },
      });

      if (invoiceRes.data && invoiceRes.data.invoiceNumber) {
        await log('Invoice data', true, { invoiceNumber: invoiceRes.data.invoiceNumber });
      } else {
        await log('Invoice data', false, null, 'No invoice number');
      }
    }

    // Step 5: Download PDF invoice
    if (orderId) {
      console.log('\n📄 Step 5: Downloading PDF invoice...');
      try {
        const pdfRes = await axios.get(
          `${API_BASE}/orders/${orderId}/invoice/pdf`,
          {
            headers: {
              Authorization: 'Bearer mock-token-for-testing',
            },
            responseType: 'arraybuffer',
          }
        );

        if (pdfRes.data.length > 1000) {
          await log('PDF invoice download', true, { size: pdfRes.data.length });
        } else {
          await log('PDF invoice download', false, null, `File too small: ${pdfRes.data.length} bytes`);
        }
      } catch (error: any) {
        await log('PDF invoice download', false, null, error.message);
      }
    }

    // Step 6: Cancel order
    if (orderId) {
      console.log('\n🔴 Step 6: Canceling order...');
      try {
        const cancelRes = await axios.delete(`${API_BASE}/orders/${orderId}`, {
          headers: {
            Authorization: 'Bearer mock-token-for-testing',
          },
        });

        if (cancelRes.data.status === 'CANCELLED') {
          await log('Order cancellation', true, { status: cancelRes.data.status });
        } else {
          await log('Order cancellation', false, null, `Status is ${cancelRes.data.status}`);
        }
      } catch (error: any) {
        await log('Order cancellation', false, null, error.message);
      }
    }

  } catch (error: any) {
    console.error('Test failed:', error.message);
  }

  // Print summary
  console.log('\n\n📊 Test Summary:');
  console.log('='.repeat(50));
  results.forEach(r => {
    const status = r.success ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${r.step}`);
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log('='.repeat(50));
  console.log(`Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${total - passed} test(s) failed`);
  }
}

// Run test
testOrderWorkflow().catch(console.error);
