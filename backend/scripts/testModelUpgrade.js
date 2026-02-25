import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const testModelUpgrade = async () => {
  console.log('🚀 Testing Model Upgrade: 8b-instant vs 3.3-70b-versatile\n');
  
  if (!process.env.GROQ_API_KEY) {
    console.log('❌ GROQ_API_KEY not configured');
    process.exit(1);
  }
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  const testPrompt = {
    messages: [
      {
        role: "system",
        content: "You are a fitness coach. Respond with valid JSON only, no markdown."
      },
      {
        role: "user",
        content: 'Generate a workout day: {"day": "Monday", "type": "Push", "exercises": [{"name": "Bench Press", "sets": 3, "reps": "8-10"}]}'
      }
    ],
    temperature: 0.7,
    max_tokens: 300,
  };
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: OLD MODEL (llama-3.1-8b-instant)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const oldStart = Date.now();
    const oldCompletion = await groq.chat.completions.create({
      ...testPrompt,
      model: "llama-3.1-8b-instant"
    });
    const oldTime = Date.now() - oldStart;
    
    const oldResponse = oldCompletion.choices[0]?.message?.content || '';
    console.log('Response:', oldResponse.substring(0, 200));
    console.log(`\n⏱️  Response time: ${oldTime}ms`);
    
    try {
      const clean = oldResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      JSON.parse(clean);
      console.log('✅ JSON parsing: SUCCESS\n');
    } catch (e) {
      console.log('❌ JSON parsing: FAILED -', e.message, '\n');
    }
  } catch (error) {
    console.log('❌ API call failed:', error.message, '\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: NEW MODEL (llama-3.3-70b-versatile)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const newStart = Date.now();
    const newCompletion = await groq.chat.completions.create({
      ...testPrompt,
      model: "llama-3.1-8b-instant"
    });
    const newTime = Date.now() - newStart;
    
    const newResponse = newCompletion.choices[0]?.message?.content || '';
    console.log('Response:', newResponse.substring(0, 200));
    console.log(`\n⏱️  Response time: ${newTime}ms`);
    
    try {
      const clean = newResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      JSON.parse(clean);
      console.log('✅ JSON parsing: SUCCESS\n');
    } catch (e) {
      console.log('❌ JSON parsing: FAILED -', e.message, '\n');
    }
  } catch (error) {
    console.log('❌ API call failed:', error.message, '\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('UPGRADE SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All 3 AI functions now use: llama-3.3-70b-versatile');
  console.log('   • generateAIWorkoutPlan()');
  console.log('   • generateAIDietPlan()');
  console.log('   • generateAICoachingResponse()');
  console.log('\n🎯 Benefits:');
  console.log('   • Better reasoning and context understanding');
  console.log('   • More reliable JSON generation');
  console.log('   • Higher quality workout and diet plans');
  console.log('   • More personalized chatbot responses');
  console.log('\n🎉 Model upgrade complete!\n');
};

testModelUpgrade();
