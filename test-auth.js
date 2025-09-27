const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication for specialist...');
    
    const email = 'specv@test.io';
    const password = 'Passw0rd!';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { specialistProfile: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      status: user.status,
      hasSpecialistProfile: !!user.specialistProfile,
      verified: user.specialistProfile?.verified
    });
    
    // Test password
    const isValid = await compare(password, user.passwordHash);
    console.log('🔐 Password valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Password mismatch');
      return;
    }
    
    console.log('✅ Authentication should work');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
