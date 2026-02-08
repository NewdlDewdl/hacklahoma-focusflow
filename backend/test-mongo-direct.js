const mongoose = require('mongoose');

// Test different URI formats
const uris = [
  'mongodb+srv://faze: @cluster0.zhmrrvr.mongodb.net/focusflow?retryWrites=true&w=majority',
  'mongodb+srv://faze:%20@cluster0.zhmrrvr.mongodb.net/focusflow?retryWrites=true&w=majority',
  'mongodb+srv://cluster0.zhmrrvr.mongodb.net/focusflow?retryWrites=true&w=majority&authSource=admin',
];

async function testConnection(uri, index) {
  console.log(`\nTest ${index + 1}:`);
  console.log(`URI: ${uri.replace(/:.*@/, ':***@')}`);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      user: 'faze',
      pass: ' ', // space character
    });
    console.log('✅ Connected!');
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    return false;
  }
}

(async () => {
  for (let i = 0; i < uris.length; i++) {
    await testConnection(uris[i], i);
  }
  process.exit(0);
})();
