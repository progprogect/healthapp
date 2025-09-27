// Using built-in fetch in Node.js

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Test specialists API
    console.log('\n📋 Testing /api/specialists...');
    const specialistsResponse = await fetch('http://localhost:3001/api/specialists');
    console.log('Status:', specialistsResponse.status);
    if (specialistsResponse.ok) {
      const data = await specialistsResponse.json();
      console.log('Specialists count:', data.items?.length || 0);
    }
    
    // Test requests feed API
    console.log('\n📋 Testing /api/requests/feed...');
    const feedResponse = await fetch('http://localhost:3001/api/requests/feed');
    console.log('Status:', feedResponse.status);
    if (feedResponse.ok) {
      const data = await feedResponse.json();
      console.log('Requests count:', data.items?.length || 0);
    } else {
      const error = await feedResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
