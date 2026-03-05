import { generate } from 'youtube-po-token-generator';

console.log('🔄 | Generating PO_TOKEN... this may take a minute and uses significant memory.');

try {
    const result = await generate();
    console.log('\n✅ | Success! Add these to your .env file:\n');
    console.log(`PO_TOKEN=${result.poToken}`);
    console.log(`VISITOR_DATA=${result.visitorData}`);
} catch (error) {
    console.error('❌ | Failed to generate token:', error.message);
}
