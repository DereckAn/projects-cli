#!/usr/bin/env bun

// Script para generar una API key segura con Bun

console.log('\n🔑 Generando API Key para tu portfolio...\n');

// Generar una key aleatoria de 32 bytes (64 caracteres hex)
const randomBytes = new Uint8Array(32);
crypto.getRandomValues(randomBytes);
const apiKey = Array.from(randomBytes)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

console.log('Tu API Key:');
console.log('━'.repeat(70));
console.log(apiKey);
console.log('━'.repeat(70));

console.log('\n📋 Pasos siguientes:\n');
console.log('1. Guarda esta key en un lugar seguro');
console.log('2. Agrégala a tu portfolio como variable de entorno:');
console.log('   PORTFOLIO_API_KEY=' + apiKey);
console.log('\n3. Agrégala a GitHub Secrets en tu proyecto:');
console.log('   - Ve a Settings > Secrets and variables > Actions');
console.log('   - New repository secret');
console.log('   - Name: PORTFOLIO_API_KEY');
console.log('   - Value: (pega la key de arriba)');
console.log('\n4. También agrega PORTFOLIO_API_URL:');
console.log('   - Name: PORTFOLIO_API_URL');
console.log('   - Value: https://tu-portfolio.com (tu URL)');
console.log('\n⚠️  IMPORTANTE: No compartas esta key públicamente!\n');
