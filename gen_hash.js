const bcrypt = require('bcrypt');

// Generate bcrypt hash for "secret"
const password = 'secret';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password:', password);
    console.log('Generated hash:', hash);
    // Verify it works
    bcrypt.compare(password, hash, (err, isMatch) => {
      if (err) {
        console.error('Verification error:', err);
      } else {
        console.log('Verification result:', isMatch);
        console.log('\nSQL INSERT statement:');
        console.log(`INSERT INTO User (id, email, passwordHash, role, createdAt, updatedAt) VALUES ('admin-123', 'admin@zedgaminghosting.hu', '${hash}', 'SUPERADMIN', NOW(), NOW());`);
      }
    });
  }
});
